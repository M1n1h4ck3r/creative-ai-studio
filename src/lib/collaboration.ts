// Collaborative features for Creative AI Studio
import { createClient } from '@supabase/supabase-js'
import { analytics } from './analytics'

export interface Project {
  id: string
  name: string
  description: string
  owner_id: string
  settings: ProjectSettings
  status: 'active' | 'archived' | 'template'
  visibility: 'private' | 'team' | 'public'
  created_at: string
  updated_at: string
  collaborators?: ProjectMember[]
  generations?: Generation[]
}

export interface ProjectSettings {
  defaultProvider?: string
  defaultModel?: string
  defaultSettings?: Record<string, any>
  allowComments: boolean
  allowEditing: boolean
  requireApproval: boolean
  brandGuidelines?: {
    colors: string[]
    fonts: string[]
    styles: string[]
    restrictions: string[]
  }
}

export interface ProjectMember {
  id: string
  user_id: string
  project_id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'commenter'
  invited_by: string
  joined_at: string
  permissions: ProjectPermissions
  user?: {
    name: string
    email: string
    avatar_url?: string
  }
}

export interface ProjectPermissions {
  canView: boolean
  canComment: boolean
  canEdit: boolean
  canGenerate: boolean
  canInvite: boolean
  canManageSettings: boolean
  canDelete: boolean
}

export interface Generation {
  id: string
  project_id: string
  created_by: string
  prompt: string
  result_url?: string
  provider: string
  settings: Record<string, any>
  status: 'pending' | 'generating' | 'completed' | 'failed'
  metadata: Record<string, any>
  comments?: Comment[]
  versions?: GenerationVersion[]
  created_at: string
  updated_at: string
}

export interface GenerationVersion {
  id: string
  generation_id: string
  version_number: number
  prompt: string
  result_url?: string
  settings: Record<string, any>
  created_by: string
  created_at: string
  parent_version_id?: string
}

export interface Comment {
  id: string
  generation_id?: string
  project_id?: string
  author_id: string
  content: string
  type: 'text' | 'suggestion' | 'approval' | 'revision'
  resolved: boolean
  created_at: string
  updated_at: string
  author?: {
    name: string
    avatar_url?: string
  }
  replies?: Comment[]
}

export interface Team {
  id: string
  name: string
  description: string
  owner_id: string
  settings: TeamSettings
  created_at: string
  members?: TeamMember[]
  projects?: Project[]
}

export interface TeamSettings {
  allowProjectCreation: boolean
  defaultProjectVisibility: 'private' | 'team' | 'public'
  requireInviteApproval: boolean
  maxProjects?: number
  maxMembers?: number
}

export interface TeamMember {
  id: string
  user_id: string
  team_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  user?: {
    name: string
    email: string
    avatar_url?: string
  }
}

// Collaboration Manager Class
export class CollaborationManager {
  private supabase: any

  constructor() {
    if (typeof window !== 'undefined') {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
  }

  // Project Management
  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project | null> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .insert({
          ...project,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (error) throw error

      // Add owner as admin member
      await this.addProjectMember(data.id, {
        user_id: project.owner_id,
        role: 'owner',
        permissions: this.getDefaultPermissions('owner')
      })

      analytics.user.projectCreated(project.name, project.visibility)
      return data
    } catch (error) {
      console.error('Failed to create project:', error)
      return null
    }
  }

  async getProject(projectId: string): Promise<Project | null> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          collaborators:project_members(
            *,
            user:users(name, email, avatar_url)
          ),
          generations(
            *,
            comments(
              *,
              author:users(name, avatar_url)
            )
          )
        `)
        .eq('id', projectId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get project:', error)
      return null
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      if (error) throw error

      analytics.user.projectUpdated(projectId)
      return true
    } catch (error) {
      console.error('Failed to update project:', error)
      return false
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      analytics.user.projectDeleted(projectId)
      return true
    } catch (error) {
      console.error('Failed to delete project:', error)
      return false
    }
  }

  // Project Members Management
  async inviteToProject(
    projectId: string, 
    email: string, 
    role: ProjectMember['role'] = 'viewer'
  ): Promise<boolean> {
    try {
      // Check if user exists
      const { data: user } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (!user) {
        // Send invitation email (implement email service)
        await this.sendProjectInvitation(email, projectId, role)
        return true
      }

      // Add user directly
      return await this.addProjectMember(projectId, {
        user_id: user.id,
        role,
        permissions: this.getDefaultPermissions(role)
      })
    } catch (error) {
      console.error('Failed to invite to project:', error)
      return false
    }
  }

  async addProjectMember(
    projectId: string, 
    member: Omit<ProjectMember, 'id' | 'project_id' | 'joined_at'>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('project_members')
        .insert({
          ...member,
          project_id: projectId,
          joined_at: new Date().toISOString()
        })

      if (error) throw error

      analytics.user.projectMemberAdded(projectId, member.role)
      return true
    } catch (error) {
      console.error('Failed to add project member:', error)
      return false
    }
  }

  async updateProjectMemberRole(
    projectId: string, 
    userId: string, 
    role: ProjectMember['role']
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('project_members')
        .update({ 
          role,
          permissions: this.getDefaultPermissions(role)
        })
        .eq('project_id', projectId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to update member role:', error)
      return false
    }
  }

  async removeProjectMember(projectId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to remove project member:', error)
      return false
    }
  }

  // Generation Management
  async createGeneration(generation: Omit<Generation, 'id' | 'created_at' | 'updated_at'>): Promise<Generation | null> {
    try {
      const { data, error } = await this.supabase
        .from('generations')
        .insert({
          ...generation,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (error) throw error

      analytics.user.generationCreated(generation.project_id, generation.provider)
      return data
    } catch (error) {
      console.error('Failed to create generation:', error)
      return null
    }
  }

  async updateGeneration(generationId: string, updates: Partial<Generation>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('generations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', generationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to update generation:', error)
      return false
    }
  }

  // Comments Management
  async addComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>): Promise<Comment | null> {
    try {
      const { data, error } = await this.supabase
        .from('comments')
        .insert({
          ...comment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          author:users(name, avatar_url)
        `)
        .single()

      if (error) throw error

      analytics.user.commentAdded(comment.generation_id || comment.project_id || '', comment.type)
      return data
    } catch (error) {
      console.error('Failed to add comment:', error)
      return null
    }
  }

  async resolveComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('comments')
        .update({ 
          resolved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to resolve comment:', error)
      return false
    }
  }

  // Real-time Subscriptions
  subscribeToProject(projectId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`project:${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'generations',
        filter: `project_id=eq.${projectId}`
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `project_id=eq.${projectId}`
      }, callback)
      .subscribe()
  }

  subscribeToGeneration(generationId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`generation:${generationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `generation_id=eq.${generationId}`
      }, callback)
      .subscribe()
  }

  // Utility Methods
  private getDefaultPermissions(role: ProjectMember['role']): ProjectPermissions {
    const permissionSets: Record<ProjectMember['role'], ProjectPermissions> = {
      owner: {
        canView: true,
        canComment: true,
        canEdit: true,
        canGenerate: true,
        canInvite: true,
        canManageSettings: true,
        canDelete: true
      },
      admin: {
        canView: true,
        canComment: true,
        canEdit: true,
        canGenerate: true,
        canInvite: true,
        canManageSettings: true,
        canDelete: false
      },
      editor: {
        canView: true,
        canComment: true,
        canEdit: true,
        canGenerate: true,
        canInvite: false,
        canManageSettings: false,
        canDelete: false
      },
      viewer: {
        canView: true,
        canComment: false,
        canEdit: false,
        canGenerate: false,
        canInvite: false,
        canManageSettings: false,
        canDelete: false
      },
      commenter: {
        canView: true,
        canComment: true,
        canEdit: false,
        canGenerate: false,
        canInvite: false,
        canManageSettings: false,
        canDelete: false
      }
    }

    return permissionSets[role]
  }

  private async sendProjectInvitation(email: string, projectId: string, role: string): Promise<void> {
    // Implement email invitation logic
    console.log(`Sending invitation to ${email} for project ${projectId} with role ${role}`)
  }

  // Team Management
  async createTeam(team: Omit<Team, 'id' | 'created_at'>): Promise<Team | null> {
    try {
      const { data, error } = await this.supabase
        .from('teams')
        .insert({
          ...team,
          created_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (error) throw error

      // Add owner as team member
      await this.addTeamMember(data.id, {
        user_id: team.owner_id,
        role: 'owner'
      })

      analytics.user.teamCreated(team.name)
      return data
    } catch (error) {
      console.error('Failed to create team:', error)
      return null
    }
  }

  async addTeamMember(
    teamId: string, 
    member: Omit<TeamMember, 'id' | 'team_id' | 'joined_at'>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('team_members')
        .insert({
          ...member,
          team_id: teamId,
          joined_at: new Date().toISOString()
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to add team member:', error)
      return false
    }
  }
}

// Singleton instance
export const collaborationManager = new CollaborationManager()
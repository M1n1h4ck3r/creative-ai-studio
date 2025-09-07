'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  UserPlus, 
  Crown, 
  Eye, 
  Edit, 
  Trash2, 
  Share2, 
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Link,
  Download,
  Settings,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  status: 'active' | 'pending' | 'inactive'
  joinedAt: string
  lastActive: string
}

interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  members: TeamMember[]
  imageCount: number
  status: 'active' | 'archived'
  visibility: 'private' | 'team' | 'public'
}

interface Comment {
  id: string
  author: TeamMember
  content: string
  createdAt: string
  imageId?: string
  resolved: boolean
}

interface TeamCollaborationProps {
  className?: string
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: undefined,
    role: 'owner',
    status: 'active',
    joinedAt: '2024-01-15',
    lastActive: '2024-01-20'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: undefined,
    role: 'admin',
    status: 'active',
    joinedAt: '2024-01-16',
    lastActive: '2024-01-19'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    avatar: undefined,
    role: 'editor',
    status: 'pending',
    joinedAt: '2024-01-18',
    lastActive: 'Never'
  }
]

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Marketing Campaign Q1',
    description: 'Creative assets for the Q1 marketing campaign',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-20',
    members: mockTeamMembers,
    imageCount: 24,
    status: 'active',
    visibility: 'team'
  },
  {
    id: '2',
    name: 'Product Launch Assets',
    description: 'Images and creatives for the new product launch',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-18',
    members: mockTeamMembers.slice(0, 2),
    imageCount: 18,
    status: 'active',
    visibility: 'private'
  }
]

const mockComments: Comment[] = [
  {
    id: '1',
    author: mockTeamMembers[1],
    content: 'This image looks great! Could we try a different color scheme?',
    createdAt: '2024-01-20T10:30:00Z',
    imageId: 'img-1',
    resolved: false
  },
  {
    id: '2',
    author: mockTeamMembers[0],
    content: 'Updated the color scheme as requested. Please review.',
    createdAt: '2024-01-20T14:15:00Z',
    imageId: 'img-1',
    resolved: true
  }
]

export default function TeamCollaboration({ className }: TeamCollaborationProps) {
  const [activeTab, setActiveTab] = useState('projects')
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [comments, setComments] = useState<Comment[]>(mockComments)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false)

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800'
      case 'admin': return 'bg-red-100 text-red-800'
      case 'editor': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'inactive': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />
      case 'admin': return <Shield className="h-4 w-4" />
      case 'editor': return <Edit className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  const handleInviteMember = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    // Check if already invited
    if (teamMembers.some(member => member.email === inviteEmail)) {
      toast.error('User already invited')
      return
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'pending',
      joinedAt: new Date().toISOString().split('T')[0],
      lastActive: 'Never'
    }

    setTeamMembers([...teamMembers, newMember])
    setInviteEmail('')
    setInviteRole('viewer')
    setShowInviteDialog(false)
    toast.success(`Invitation sent to ${inviteEmail}`)
  }

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name')
      return
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      description: newProjectDescription,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      members: [teamMembers[0]], // Owner
      imageCount: 0,
      status: 'active',
      visibility: 'team'
    }

    setProjects([newProject, ...projects])
    setNewProjectName('')
    setNewProjectDescription('')
    setShowCreateProjectDialog(false)
    toast.success('Project created successfully')
  }

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== memberId))
    toast.success('Member removed from team')
  }

  const handleUpdateRole = (memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    setTeamMembers(teamMembers.map(member => 
      member.id === memberId 
        ? { ...member, role: newRole }
        : member
    ))
    toast.success('Member role updated')
  }

  const copyProjectLink = (projectId: string) => {
    const link = `${window.location.origin}/project/${projectId}`
    navigator.clipboard.writeText(link)
    toast.success('Project link copied to clipboard')
  }

  const exportProjectData = (project: Project) => {
    const data = {
      project,
      exportedAt: new Date().toISOString(),
      members: project.members
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-')}-export.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Project data exported')
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Team Collaboration</span>
        </CardTitle>
        <CardDescription>
          Manage projects, team members, and collaborate on creative assets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Projects</h3>
              <Dialog open={showCreateProjectDialog} onOpenChange={setShowCreateProjectDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Create a new collaborative project for your team
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input
                        placeholder="Enter project name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Describe the project"
                        value={newProjectDescription}
                        onChange={(e) => setNewProjectDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateProjectDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateProject}>
                        Create Project
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{project.name}</h4>
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                          <Badge variant="outline">
                            {project.visibility}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{project.imageCount} images</span>
                          <span>{project.members.length} members</span>
                          <span>Updated {project.updatedAt}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyProjectLink(project.id)}
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportProjectData(project)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center space-x-2">
                      <span className="text-sm font-medium">Team:</span>
                      <div className="flex -space-x-2">
                        {project.members.slice(0, 5).map((member) => (
                          <Avatar key={member.id} className="w-6 h-6 border-2 border-background">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project.members.length > 5 && (
                          <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                            +{project.members.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Team Members</h3>
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to collaborate on projects
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        placeholder="colleague@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">
                            <div className="flex items-center space-x-2">
                              <Eye className="h-4 w-4" />
                              <span>Viewer - Can view projects</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="editor">
                            <div className="flex items-center space-x-2">
                              <Edit className="h-4 w-4" />
                              <span>Editor - Can create and edit</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4" />
                              <span>Admin - Can manage team</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleInviteMember}>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Invitation
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {teamMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{member.name}</span>
                            <Badge className={getRoleColor(member.role)}>
                              <div className="flex items-center space-x-1">
                                {getRoleIcon(member.role)}
                                <span>{member.role}</span>
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className={getStatusColor(member.status)}>
                              {member.status === 'active' ? <CheckCircle className="inline h-3 w-3 mr-1" /> : 
                               member.status === 'pending' ? <Clock className="inline h-3 w-3 mr-1" /> :
                               <XCircle className="inline h-3 w-3 mr-1" />}
                              {member.status}
                            </span>
                            <span>Joined {member.joinedAt}</span>
                            <span>Last active: {member.lastActive}</span>
                          </div>
                        </div>
                      </div>

                      {member.role !== 'owner' && (
                        <div className="flex items-center space-x-2">
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleUpdateRole(member.id, value as any)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Comments</h3>
              <Badge variant="outline">{comments.length} total</Badge>
            </div>

            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback>
                          {comment.author.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{comment.author.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                          {comment.resolved && (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        {comment.imageId && (
                          <Badge variant="secondary" className="mt-2">
                            Image: {comment.imageId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <h3 className="text-lg font-semibold">Team Settings</h3>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Permissions</CardTitle>
                  <CardDescription>
                    Configure default permissions for new projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Project Visibility</Label>
                    <Select defaultValue="team">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private - Only invited members</SelectItem>
                        <SelectItem value="team">Team - All team members</SelectItem>
                        <SelectItem value="public">Public - Anyone with link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Invitation</Label>
                    <Select defaultValue="admin">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Only owners can invite</SelectItem>
                        <SelectItem value="admin">Owners and admins can invite</SelectItem>
                        <SelectItem value="all">All members can invite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notifications</CardTitle>
                  <CardDescription>
                    Manage team notification settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Member Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when new members join the team
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Comment Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when someone comments on your images
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Project Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify about project changes and updates
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Team collaboration features require a Pro plan. 
                  <Button variant="link" className="p-0 h-auto ml-1">
                    Upgrade now
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
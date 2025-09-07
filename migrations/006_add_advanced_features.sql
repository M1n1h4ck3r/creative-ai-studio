-- Migration 006: Add tables for advanced features
-- Created: 2025-09-07
-- Description: Add tables for developer API keys, team collaboration, batch processing

-- Developer API Keys table
CREATE TABLE IF NOT EXISTS developer_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    key_prefix VARCHAR(50) NOT NULL,
    scopes TEXT[] DEFAULT '{generate}',
    rate_limit INTEGER DEFAULT 1000,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Create index for API key lookups
CREATE INDEX IF NOT EXISTS idx_developer_api_keys_api_key ON developer_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_developer_api_keys_user_id ON developer_api_keys(user_id);

-- Team Projects table
CREATE TABLE IF NOT EXISTS team_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    visibility VARCHAR(20) DEFAULT 'team' CHECK (visibility IN ('private', 'team', 'public')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    image_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES team_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES profiles(id),
    UNIQUE(project_id, user_id)
);

-- Project Comments table
CREATE TABLE IF NOT EXISTS project_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES team_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    image_id UUID REFERENCES image_history(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch Jobs table
CREATE TABLE IF NOT EXISTS batch_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES team_projects(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    total_images INTEGER NOT NULL,
    completed_images INTEGER DEFAULT 0,
    failed_images INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    settings JSONB DEFAULT '{}',
    error_log TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Batch Job Items table
CREATE TABLE IF NOT EXISTS batch_job_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_job_id UUID NOT NULL REFERENCES batch_jobs(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    image_url TEXT,
    error_message TEXT,
    cost_usd DECIMAL(10,4),
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Update image_history table to link with projects and batch jobs
ALTER TABLE image_history ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES team_projects(id) ON DELETE SET NULL;
ALTER TABLE image_history ADD COLUMN IF NOT EXISTS batch_job_id UUID REFERENCES batch_jobs(id) ON DELETE SET NULL;
ALTER TABLE image_history ADD COLUMN IF NOT EXISTS api_key_id UUID REFERENCES developer_api_keys(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_projects_owner_id ON team_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_project_id ON team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_user_id ON project_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_id ON batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_job_items_batch_job_id ON batch_job_items(batch_job_id);
CREATE INDEX IF NOT EXISTS idx_image_history_project_id ON image_history(project_id);
CREATE INDEX IF NOT EXISTS idx_image_history_batch_job_id ON image_history(batch_job_id);

-- Create RLS policies for team features

-- Developer API Keys policies
ALTER TABLE developer_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys" ON developer_api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Team Projects policies
ALTER TABLE team_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects they are members of" ON team_projects
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        id IN (
            SELECT project_id FROM team_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Project owners can manage their projects" ON team_projects
    FOR ALL USING (owner_id = auth.uid());

-- Team Members policies  
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members of their projects" ON team_members
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM team_projects 
            WHERE owner_id = auth.uid() OR 
            id IN (
                SELECT project_id FROM team_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY "Project owners and admins can manage team members" ON team_members
    FOR ALL USING (
        project_id IN (
            SELECT id FROM team_projects WHERE owner_id = auth.uid()
        ) OR
        project_id IN (
            SELECT project_id FROM team_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- Project Comments policies
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their projects" ON project_comments
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM team_projects 
            WHERE owner_id = auth.uid() OR 
            id IN (
                SELECT project_id FROM team_members 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY "Team members can create comments" ON project_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        project_id IN (
            SELECT project_id FROM team_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can update their own comments" ON project_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Batch Jobs policies
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_job_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own batch jobs" ON batch_jobs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage items of their own batch jobs" ON batch_job_items
    FOR ALL USING (
        batch_job_id IN (
            SELECT id FROM batch_jobs WHERE user_id = auth.uid()
        )
    );

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_developer_api_keys_updated_at 
    BEFORE UPDATE ON developer_api_keys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_projects_updated_at 
    BEFORE UPDATE ON team_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_comments_updated_at 
    BEFORE UPDATE ON project_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_jobs_updated_at 
    BEFORE UPDATE ON batch_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
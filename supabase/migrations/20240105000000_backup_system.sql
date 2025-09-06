-- Backup system tables
-- Create backup jobs table
CREATE TABLE IF NOT EXISTS backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  type TEXT NOT NULL CHECK (type IN ('manual', 'scheduled')) DEFAULT 'manual',
  config JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  size_bytes BIGINT,
  items_count INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for backup jobs
CREATE INDEX IF NOT EXISTS idx_backup_jobs_user_id ON backup_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_type ON backup_jobs(type);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_created_at ON backup_jobs(created_at DESC);

-- Create backup destinations table
CREATE TABLE IF NOT EXISTS backup_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('local', 's3', 'gcs', 'azure')),
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create indexes for backup destinations
CREATE INDEX IF NOT EXISTS idx_backup_destinations_user_id ON backup_destinations(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_destinations_type ON backup_destinations(type);
CREATE INDEX IF NOT EXISTS idx_backup_destinations_enabled ON backup_destinations(enabled);

-- Create backup schedules table
CREATE TABLE IF NOT EXISTS backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  next_run TIMESTAMPTZ,
  last_run TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create indexes for backup schedules
CREATE INDEX IF NOT EXISTS idx_backup_schedules_user_id ON backup_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_next_run ON backup_schedules(next_run);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_enabled ON backup_schedules(enabled);

-- Create backup restore logs table
CREATE TABLE IF NOT EXISTS backup_restore_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  backup_source TEXT NOT NULL,
  restore_options JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for restore logs
CREATE INDEX IF NOT EXISTS idx_backup_restore_logs_user_id ON backup_restore_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_restore_logs_status ON backup_restore_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_restore_logs_started_at ON backup_restore_logs(started_at DESC);

-- Update function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_backup_jobs_updated_at BEFORE UPDATE ON backup_jobs 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_backup_destinations_updated_at BEFORE UPDATE ON backup_destinations 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_backup_schedules_updated_at BEFORE UPDATE ON backup_schedules 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_restore_logs ENABLE ROW LEVEL SECURITY;

-- Backup jobs policies
CREATE POLICY "Users can view their own backup jobs" ON backup_jobs
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own backup jobs" ON backup_jobs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own backup jobs" ON backup_jobs
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own backup jobs" ON backup_jobs
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Backup destinations policies
CREATE POLICY "Users can view their own backup destinations" ON backup_destinations
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own backup destinations" ON backup_destinations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own backup destinations" ON backup_destinations
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own backup destinations" ON backup_destinations
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Backup schedules policies
CREATE POLICY "Users can view their own backup schedules" ON backup_schedules
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own backup schedules" ON backup_schedules
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own backup schedules" ON backup_schedules
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own backup schedules" ON backup_schedules
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Backup restore logs policies
CREATE POLICY "Users can view their own restore logs" ON backup_restore_logs
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own restore logs" ON backup_restore_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own restore logs" ON backup_restore_logs
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Function to cleanup old backup jobs
CREATE OR REPLACE FUNCTION cleanup_old_backup_jobs(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM backup_jobs 
    WHERE completed_at < NOW() - (retention_days || ' days')::INTERVAL
    AND status IN ('completed', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get backup statistics
CREATE OR REPLACE FUNCTION get_backup_stats(p_user_id UUID)
RETURNS TABLE (
    total_backups BIGINT,
    successful_backups BIGINT,
    failed_backups BIGINT,
    total_size_bytes BIGINT,
    avg_size_bytes NUMERIC,
    last_backup TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_backups,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_backups,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_backups,
        COALESCE(SUM(size_bytes), 0) as total_size_bytes,
        COALESCE(AVG(size_bytes), 0) as avg_size_bytes,
        MAX(completed_at) as last_backup
    FROM backup_jobs 
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule next backup run
CREATE OR REPLACE FUNCTION update_next_backup_run()
RETURNS TRIGGER AS $$
BEGIN
    NEW.next_run = CASE 
        WHEN NEW.frequency = 'daily' THEN NOW() + INTERVAL '1 day'
        WHEN NEW.frequency = 'weekly' THEN NOW() + INTERVAL '1 week'
        WHEN NEW.frequency = 'monthly' THEN NOW() + INTERVAL '1 month'
        ELSE NEW.next_run
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic next run scheduling
CREATE TRIGGER update_backup_schedule_next_run BEFORE INSERT OR UPDATE ON backup_schedules 
  FOR EACH ROW EXECUTE PROCEDURE update_next_backup_run();

-- Comments for documentation
COMMENT ON TABLE backup_jobs IS 'Stores backup job information and status';
COMMENT ON TABLE backup_destinations IS 'Stores backup destination configurations';
COMMENT ON TABLE backup_schedules IS 'Stores automated backup schedules';
COMMENT ON TABLE backup_restore_logs IS 'Logs backup restore operations';

COMMENT ON COLUMN backup_jobs.config IS 'JSON configuration including what to backup and options';
COMMENT ON COLUMN backup_jobs.metadata IS 'Additional metadata like version, hash, etc.';
COMMENT ON COLUMN backup_destinations.config IS 'Destination-specific configuration (credentials, paths, etc.)';
COMMENT ON COLUMN backup_schedules.config IS 'Backup configuration for scheduled runs';
COMMENT ON COLUMN backup_restore_logs.result IS 'JSON result including restored items count and conflicts';
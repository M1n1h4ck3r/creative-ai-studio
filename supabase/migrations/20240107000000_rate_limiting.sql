-- Rate limiting system tables
-- Create user quotas table
CREATE TABLE IF NOT EXISTS user_quotas (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'enterprise', 'custom')) DEFAULT 'free',
  daily_generations INTEGER NOT NULL DEFAULT 10,
  monthly_generations INTEGER NOT NULL DEFAULT 100,
  api_calls_per_minute INTEGER NOT NULL DEFAULT 30,
  api_calls_per_hour INTEGER NOT NULL DEFAULT 1000,
  api_calls_per_day INTEGER NOT NULL DEFAULT 10000,
  concurrent_requests INTEGER NOT NULL DEFAULT 5,
  priority_level INTEGER NOT NULL DEFAULT 1 CHECK (priority_level >= 1 AND priority_level <= 10),
  features JSONB NOT NULL DEFAULT '["basic_generation", "templates"]',
  expires_at TIMESTAMPTZ,
  usage JSONB NOT NULL DEFAULT '{"daily_generations_used": 0, "monthly_generations_used": 0, "api_calls_today": 0, "last_reset": "2024-01-01T00:00:00Z"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create rate limit rules table
CREATE TABLE IF NOT EXISTS rate_limit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  endpoint_pattern TEXT NOT NULL,
  method TEXT CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', '*')) DEFAULT '*',
  limit_per_minute INTEGER NOT NULL DEFAULT 60,
  limit_per_hour INTEGER NOT NULL DEFAULT 1000,
  limit_per_day INTEGER NOT NULL DEFAULT 10000,
  burst_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  apply_to TEXT NOT NULL CHECK (apply_to IN ('all', 'authenticated', 'anonymous', 'plan', 'user')) DEFAULT 'all',
  plan_types JSONB,
  user_ids JSONB,
  ip_ranges JSONB,
  priority INTEGER NOT NULL DEFAULT 100,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create usage metrics table
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ip INET NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_time INTEGER DEFAULT 0,
  status_code INTEGER DEFAULT 0,
  user_agent TEXT,
  rate_limit_hit BOOLEAN NOT NULL DEFAULT false,
  quota_exceeded BOOLEAN NOT NULL DEFAULT false,
  request_size INTEGER DEFAULT 0,
  response_size INTEGER DEFAULT 0
);

-- Create IP whitelist table
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip INET NOT NULL UNIQUE,
  description TEXT,
  added_by UUID REFERENCES profiles(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create IP blacklist table
CREATE TABLE IF NOT EXISTS ip_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip INET NOT NULL UNIQUE,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  added_by UUID REFERENCES profiles(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create rate limit violations table
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ip INET NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  rule_id UUID REFERENCES rate_limit_rules(id),
  violation_type TEXT NOT NULL CHECK (violation_type IN ('rate_limit', 'quota_exceeded', 'concurrent_limit', 'blacklisted')),
  limit_exceeded INTEGER NOT NULL,
  current_usage INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  blocked BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_quotas_plan_type ON user_quotas(plan_type);
CREATE INDEX IF NOT EXISTS idx_user_quotas_expires_at ON user_quotas(expires_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_endpoint ON rate_limit_rules(endpoint_pattern);
CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_enabled ON rate_limit_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_priority ON rate_limit_rules(priority DESC);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_id ON usage_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_ip ON usage_metrics(ip);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_endpoint ON usage_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_timestamp ON usage_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_rate_limit_hit ON usage_metrics(rate_limit_hit);

CREATE INDEX IF NOT EXISTS idx_ip_whitelist_ip ON ip_whitelist(ip);
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_active ON ip_whitelist(active);

CREATE INDEX IF NOT EXISTS idx_ip_blacklist_ip ON ip_blacklist(ip);
CREATE INDEX IF NOT EXISTS idx_ip_blacklist_active ON ip_blacklist(active);
CREATE INDEX IF NOT EXISTS idx_ip_blacklist_expires_at ON ip_blacklist(expires_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_user_id ON rate_limit_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_ip ON rate_limit_violations(ip);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_timestamp ON rate_limit_violations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_type ON rate_limit_violations(violation_type);

-- Update triggers
CREATE TRIGGER update_user_quotas_updated_at BEFORE UPDATE ON user_quotas 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_rate_limit_rules_updated_at BEFORE UPDATE ON rate_limit_rules 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- User quotas policies
CREATE POLICY "Users can view their own quota" ON user_quotas
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own usage" ON user_quotas
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Usage metrics policies (users can only view their own)
CREATE POLICY "Users can view their own usage metrics" ON usage_metrics
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Rate limit violations policies
CREATE POLICY "Users can view their own violations" ON rate_limit_violations
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Admin tables (rate_limit_rules, ip_whitelist, ip_blacklist) are read-only for users
CREATE POLICY "Everyone can view active rate limit rules" ON rate_limit_rules
  FOR SELECT USING (enabled = true);

CREATE POLICY "Everyone can view active ip whitelist" ON ip_whitelist
  FOR SELECT USING (active = true);

CREATE POLICY "Everyone can view active ip blacklist" ON ip_blacklist
  FOR SELECT USING (active = true);

-- Insert default rate limit rules
INSERT INTO rate_limit_rules (name, description, endpoint_pattern, method, limit_per_minute, limit_per_hour, limit_per_day, apply_to, priority) VALUES
  ('API Generation Limit', 'Rate limit for AI generation endpoints', '/api/generate.*', 'POST', 30, 300, 1000, 'all', 100),
  ('API Cost Estimation', 'Rate limit for cost estimation', '/api/estimate-cost', '*', 60, 600, 2000, 'all', 90),
  ('Template Access', 'Rate limit for template operations', '/api/templates.*', '*', 120, 1200, 5000, 'all', 80),
  ('Project Operations', 'Rate limit for project operations', '/api/projects.*', '*', 100, 1000, 4000, 'authenticated', 70),
  ('Backup Operations', 'Rate limit for backup operations', '/api/backup.*', '*', 10, 50, 200, 'authenticated', 60),
  ('Notification Operations', 'Rate limit for notification operations', '/api/notifications.*', '*', 60, 300, 1000, 'authenticated', 50)
ON CONFLICT (name) DO NOTHING;

-- Insert default user quotas for existing users
INSERT INTO user_quotas (user_id, plan_type, daily_generations, monthly_generations, api_calls_per_minute, api_calls_per_hour, api_calls_per_day, concurrent_requests, priority_level, features)
SELECT 
  id as user_id,
  'free' as plan_type,
  10 as daily_generations,
  100 as monthly_generations,
  30 as api_calls_per_minute,
  1000 as api_calls_per_hour,
  10000 as api_calls_per_day,
  5 as concurrent_requests,
  1 as priority_level,
  '["basic_generation", "templates"]'::jsonb as features
FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_quotas);

-- Functions for rate limiting management
CREATE OR REPLACE FUNCTION get_user_quota_with_reset(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  plan_type TEXT,
  daily_generations INTEGER,
  monthly_generations INTEGER,
  api_calls_per_minute INTEGER,
  api_calls_per_hour INTEGER,
  api_calls_per_day INTEGER,
  concurrent_requests INTEGER,
  priority_level INTEGER,
  features JSONB,
  expires_at TIMESTAMPTZ,
  usage JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Reset daily usage if needed
  UPDATE user_quotas 
  SET usage = jsonb_set(
    jsonb_set(
      jsonb_set(usage, '{daily_generations_used}', '0'),
      '{api_calls_today}', '0'
    ),
    '{last_reset}', to_jsonb(CURRENT_DATE::text)
  )
  WHERE user_quotas.user_id = p_user_id
  AND (usage->>'last_reset')::date < CURRENT_DATE;

  -- Reset monthly usage if needed  
  UPDATE user_quotas 
  SET usage = jsonb_set(usage, '{monthly_generations_used}', '0')
  WHERE user_quotas.user_id = p_user_id
  AND EXTRACT(month FROM (usage->>'last_reset')::date) != EXTRACT(month FROM CURRENT_DATE);

  RETURN QUERY
  SELECT uq.*
  FROM user_quotas uq
  WHERE uq.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record rate limit violation
CREATE OR REPLACE FUNCTION record_rate_limit_violation(
  p_user_id UUID,
  p_ip INET,
  p_endpoint TEXT,
  p_method TEXT,
  p_rule_id UUID,
  p_violation_type TEXT,
  p_limit_exceeded INTEGER,
  p_current_usage INTEGER,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO rate_limit_violations (
    user_id, ip, endpoint, method, rule_id, violation_type,
    limit_exceeded, current_usage, user_agent
  ) VALUES (
    p_user_id, p_ip, p_endpoint, p_method, p_rule_id, p_violation_type,
    p_limit_exceeded, p_current_usage, p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get rate limit statistics
CREATE OR REPLACE FUNCTION get_rate_limit_stats(p_user_id UUID, p_period_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  total_requests BIGINT,
  successful_requests BIGINT,
  rate_limited_requests BIGINT,
  quota_exceeded_requests BIGINT,
  avg_response_time NUMERIC,
  most_used_endpoints JSONB,
  violations_by_type JSONB
) AS $$
DECLARE
  endpoint_stats JSONB = '{}';
  violation_stats JSONB = '{}';
  endpoint RECORD;
  violation RECORD;
BEGIN
  -- Get endpoint usage statistics
  FOR endpoint IN
    SELECT 
      um.endpoint,
      COUNT(*) as request_count,
      AVG(um.response_time) as avg_time
    FROM usage_metrics um
    WHERE um.user_id = p_user_id 
    AND um.timestamp >= NOW() - (p_period_hours || ' hours')::INTERVAL
    GROUP BY um.endpoint
    ORDER BY COUNT(*) DESC
    LIMIT 10
  LOOP
    endpoint_stats = jsonb_set(
      endpoint_stats,
      ARRAY[endpoint.endpoint],
      jsonb_build_object(
        'requests', endpoint.request_count,
        'avg_response_time', ROUND(endpoint.avg_time, 2)
      )
    );
  END LOOP;

  -- Get violation statistics
  FOR violation IN
    SELECT 
      rlv.violation_type,
      COUNT(*) as violation_count
    FROM rate_limit_violations rlv
    WHERE rlv.user_id = p_user_id 
    AND rlv.timestamp >= NOW() - (p_period_hours || ' hours')::INTERVAL
    GROUP BY rlv.violation_type
  LOOP
    violation_stats = jsonb_set(
      violation_stats,
      ARRAY[violation.violation_type],
      violation.violation_count::text::jsonb
    );
  END LOOP;

  RETURN QUERY
  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as successful_requests,
    COUNT(*) FILTER (WHERE rate_limit_hit = true) as rate_limited_requests,
    COUNT(*) FILTER (WHERE quota_exceeded = true) as quota_exceeded_requests,
    ROUND(AVG(response_time), 2) as avg_response_time,
    endpoint_stats as most_used_endpoints,
    violation_stats as violations_by_type
  FROM usage_metrics
  WHERE user_id = p_user_id 
  AND timestamp >= NOW() - (p_period_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old usage metrics
CREATE OR REPLACE FUNCTION cleanup_old_usage_metrics(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM usage_metrics 
    WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user plan
CREATE OR REPLACE FUNCTION update_user_plan(
  p_user_id UUID,
  p_plan_type TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  plan_config RECORD;
BEGIN
  -- Get plan configuration
  SELECT 
    CASE p_plan_type
      WHEN 'free' THEN ROW(10, 100, 30, 1000, 10000, 5, 1, '["basic_generation", "templates"]'::jsonb)
      WHEN 'pro' THEN ROW(100, 2000, 120, 5000, 50000, 15, 5, '["basic_generation", "advanced_generation", "templates", "collaboration", "backup"]'::jsonb)
      WHEN 'enterprise' THEN ROW(1000, 20000, 600, 20000, 200000, 50, 8, '["basic_generation", "advanced_generation", "templates", "collaboration", "backup", "audit", "priority_support"]'::jsonb)
      WHEN 'custom' THEN ROW(10000, 100000, 1200, 50000, 500000, 100, 10, '["all"]'::jsonb)
    END
  INTO plan_config;

  -- Update user quota
  INSERT INTO user_quotas (
    user_id, plan_type, daily_generations, monthly_generations,
    api_calls_per_minute, api_calls_per_hour, api_calls_per_day,
    concurrent_requests, priority_level, features, expires_at
  ) VALUES (
    p_user_id, p_plan_type, plan_config.f1, plan_config.f2,
    plan_config.f3, plan_config.f4, plan_config.f5,
    plan_config.f6, plan_config.f7, plan_config.f8, p_expires_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_type = EXCLUDED.plan_type,
    daily_generations = EXCLUDED.daily_generations,
    monthly_generations = EXCLUDED.monthly_generations,
    api_calls_per_minute = EXCLUDED.api_calls_per_minute,
    api_calls_per_hour = EXCLUDED.api_calls_per_hour,
    api_calls_per_day = EXCLUDED.api_calls_per_day,
    concurrent_requests = EXCLUDED.concurrent_requests,
    priority_level = EXCLUDED.priority_level,
    features = EXCLUDED.features,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE user_quotas IS 'User-specific API quotas and usage limits based on their plan';
COMMENT ON TABLE rate_limit_rules IS 'Configurable rate limiting rules for different endpoints and user types';
COMMENT ON TABLE usage_metrics IS 'Detailed usage tracking for all API requests';
COMMENT ON TABLE ip_whitelist IS 'IP addresses that bypass rate limiting';
COMMENT ON TABLE ip_blacklist IS 'IP addresses that are blocked from accessing the API';
COMMENT ON TABLE rate_limit_violations IS 'Log of rate limit violations for monitoring and abuse detection';

COMMENT ON COLUMN user_quotas.usage IS 'JSON object tracking current usage counters and last reset times';
COMMENT ON COLUMN rate_limit_rules.endpoint_pattern IS 'Regex pattern to match API endpoints';
COMMENT ON COLUMN rate_limit_rules.burst_multiplier IS 'Multiplier for burst allowance (e.g., 1.5 = 50% burst)';
COMMENT ON COLUMN usage_metrics.rate_limit_hit IS 'Whether this request was rate limited';
COMMENT ON COLUMN usage_metrics.quota_exceeded IS 'Whether this request exceeded user quota';
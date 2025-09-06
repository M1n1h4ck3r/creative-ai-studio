-- Notification system tables
-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  platform TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  last_used TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Create push notifications table
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,
  badge TEXT,
  action_url TEXT,
  data JSONB DEFAULT '{}',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')) DEFAULT 'pending',
  channels JSONB NOT NULL DEFAULT '{"push": true, "email": false, "sms": false, "desktop": true}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  action_url TEXT,
  icon TEXT,
  badge TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  expire_after INTEGER, -- seconds
  variables JSONB NOT NULL DEFAULT '[]',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notification delivery logs table
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES push_notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  provider TEXT,
  provider_message_id TEXT,
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notification preferences table (extends user_settings)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  channels JSONB NOT NULL DEFAULT '{"push": true, "email": false, "sms": false, "desktop": true}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

CREATE INDEX IF NOT EXISTS idx_push_notifications_user_id ON push_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON push_notifications(status);
CREATE INDEX IF NOT EXISTS idx_push_notifications_type ON push_notifications(type);
CREATE INDEX IF NOT EXISTS idx_push_notifications_scheduled_for ON push_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_push_notifications_created_at ON push_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_notifications_read_at ON push_notifications(read_at);

CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_enabled ON notification_templates(enabled);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_notification_id ON notification_delivery_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_channel ON notification_delivery_logs(channel);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_status ON notification_delivery_logs(status);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(type);

-- Update triggers
CREATE TRIGGER update_push_notifications_updated_at BEFORE UPDATE ON push_notifications 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Push subscriptions policies
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Push notifications policies
CREATE POLICY "Users can view their own notifications" ON push_notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own notifications" ON push_notifications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notifications" ON push_notifications
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Notification delivery logs policies (read-only for users)
CREATE POLICY "Users can view their notification delivery logs" ON notification_delivery_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM push_notifications pn 
      WHERE pn.id = notification_delivery_logs.notification_id 
      AND pn.user_id::text = auth.uid()::text
    )
  );

-- Notification preferences policies
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own notification preferences" ON notification_preferences
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Template table is read-only for regular users
CREATE POLICY "Everyone can view notification templates" ON notification_templates
  FOR SELECT USING (enabled = true);

-- Insert default notification templates
INSERT INTO notification_templates (type, title_template, body_template, action_url, icon, priority, expire_after, variables) VALUES
  ('generation_complete', '✨ Geração Completa!', 'Sua {{generation_type}} "{{prompt_preview}}" foi gerada com sucesso.', '/dashboard/generations/{{generation_id}}', '/icons/check-circle.png', 'normal', 3600, '["generation_type", "prompt_preview", "generation_id"]'),
  ('generation_failed', '❌ Erro na Geração', 'Falha ao gerar {{generation_type}}. {{error_message}}', '/dashboard/generations', '/icons/error.png', 'high', 7200, '["generation_type", "error_message"]'),
  ('backup_complete', '💾 Backup Concluído', 'Backup automático concluído. {{items_count}} items salvos ({{size_mb}} MB).', '/dashboard/backup', '/icons/backup.png', 'low', 1800, '["items_count", "size_mb"]'),
  ('backup_failed', '⚠️ Falha no Backup', 'Erro durante backup automático: {{error_message}}', '/dashboard/backup', '/icons/warning.png', 'high', 7200, '["error_message"]'),
  ('collaboration_invite', '🤝 Convite de Colaboração', '{{sender_name}} te convidou para colaborar no projeto "{{project_name}}".', '/dashboard/collaborations/{{invitation_id}}', '/icons/collaboration.png', 'normal', 86400, '["sender_name", "project_name", "invitation_id"]'),
  ('security_alert', '🔒 Alerta de Segurança', '{{alert_type}}: {{description}}. Verifique sua conta.', '/dashboard/security', '/icons/security.png', 'urgent', 3600, '["alert_type", "description"]'),
  ('usage_limit', '📊 Limite de Uso', 'Você usou {{percentage}}% do seu limite mensal de {{resource}}.', '/dashboard/usage', '/icons/chart.png', 'normal', 7200, '["percentage", "resource"]')
ON CONFLICT (type) DO NOTHING;

-- Functions for notification management
CREATE OR REPLACE FUNCTION get_notification_stats(p_user_id UUID)
RETURNS TABLE (
    total_sent BIGINT,
    total_delivered BIGINT,
    total_failed BIGINT,
    total_read BIGINT,
    read_rate NUMERIC,
    delivery_rate NUMERIC,
    categories JSONB
) AS $$
DECLARE
    category_stats JSONB = '{}';
    category RECORD;
BEGIN
    -- Get category statistics
    FOR category IN
        SELECT 
            type,
            COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) as sent,
            COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
            COUNT(*) FILTER (WHERE read_at IS NOT NULL) as read
        FROM push_notifications 
        WHERE user_id = p_user_id
        GROUP BY type
    LOOP
        category_stats = jsonb_set(
            category_stats,
            ARRAY[category.type],
            jsonb_build_object(
                'sent', category.sent,
                'delivered', category.delivered,
                'read', category.read
            )
        );
    END LOOP;

    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) as total_sent,
        COUNT(*) FILTER (WHERE status = 'delivered') as total_delivered,
        COUNT(*) FILTER (WHERE status = 'failed') as total_failed,
        COUNT(*) FILTER (WHERE read_at IS NOT NULL) as total_read,
        CASE 
            WHEN COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) > 0 THEN
                ROUND(
                    (COUNT(*) FILTER (WHERE read_at IS NOT NULL)::NUMERIC / 
                     COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))) * 100, 
                    2
                )
            ELSE 0
        END as read_rate,
        CASE 
            WHEN COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) > 0 THEN
                ROUND(
                    (COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / 
                     COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))) * 100, 
                    2
                )
            ELSE 0
        END as delivery_rate,
        category_stats as categories
    FROM push_notifications 
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM push_notifications 
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
    AND status IN ('sent', 'delivered', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending scheduled notifications
CREATE OR REPLACE FUNCTION get_pending_scheduled_notifications()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    type TEXT,
    title TEXT,
    body TEXT,
    data JSONB,
    channels JSONB,
    scheduled_for TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pn.id,
        pn.user_id,
        pn.type,
        pn.title,
        pn.body,
        pn.data,
        pn.channels,
        pn.scheduled_for
    FROM push_notifications pn
    WHERE pn.status = 'pending'
    AND pn.scheduled_for IS NOT NULL
    AND pn.scheduled_for <= NOW()
    ORDER BY pn.scheduled_for ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE push_subscriptions IS 'Stores user push notification subscriptions for different devices/browsers';
COMMENT ON TABLE push_notifications IS 'Stores all push notifications sent to users';
COMMENT ON TABLE notification_templates IS 'Template definitions for different notification types';
COMMENT ON TABLE notification_delivery_logs IS 'Logs delivery attempts and results for different channels';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification types and channels';

COMMENT ON COLUMN push_notifications.channels IS 'JSON object defining which channels to use for delivery';
COMMENT ON COLUMN push_notifications.data IS 'Additional data to be included in the notification payload';
COMMENT ON COLUMN push_notifications.metadata IS 'Metadata like delivery confirmations, click tracking, etc.';
COMMENT ON COLUMN notification_templates.variables IS 'Array of template variable names that can be substituted';
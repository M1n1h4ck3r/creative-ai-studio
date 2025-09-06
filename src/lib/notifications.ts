'use client'

import { createClient } from '@/lib/supabase'
import { AuditLogger } from '@/lib/audit'

export interface NotificationConfig {
  enabled: boolean
  sound: boolean
  vibration: boolean
  desktop: boolean
  email: boolean
  sms: boolean
  categories: {
    generation_complete: boolean
    generation_failed: boolean
    backup_complete: boolean
    backup_failed: boolean
    collaboration_invite: boolean
    system_maintenance: boolean
    security_alert: boolean
    usage_limit: boolean
    subscription_update: boolean
  }
}

export interface NotificationTemplate {
  id: string
  type: keyof NotificationConfig['categories']
  title_template: string
  body_template: string
  action_url?: string
  icon?: string
  badge?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  expire_after?: number // seconds
  variables: string[] // Template variables like {{user_name}}, {{project_name}}
}

export interface PushNotification {
  id: string
  user_id: string
  type: keyof NotificationConfig['categories']
  title: string
  body: string
  icon?: string
  badge?: string
  action_url?: string
  data?: Record<string, any>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduled_for?: Date
  sent_at?: Date
  read_at?: Date
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled'
  channels: {
    push: boolean
    email: boolean
    sms: boolean
    desktop: boolean
  }
  metadata: {
    push_subscription_id?: string
    email_message_id?: string
    sms_message_id?: string
    error?: string
  }
  created_at: Date
  updated_at: Date
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string
  platform?: string
  active: boolean
  last_used: Date
  created_at: Date
}

export interface NotificationStats {
  total_sent: number
  total_delivered: number
  total_failed: number
  total_read: number
  read_rate: number
  delivery_rate: number
  categories: Record<string, {
    sent: number
    delivered: number
    read: number
  }>
}

// Default notification templates
const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'generation_complete',
    type: 'generation_complete',
    title_template: '✨ Geração Completa!',
    body_template: 'Sua {{generation_type}} "{{prompt_preview}}" foi gerada com sucesso.',
    action_url: '/dashboard/generations/{{generation_id}}',
    icon: '/icons/check-circle.png',
    badge: '/icons/badge.png',
    priority: 'normal',
    expire_after: 3600,
    variables: ['generation_type', 'prompt_preview', 'generation_id']
  },
  {
    id: 'generation_failed',
    type: 'generation_failed',
    title_template: '❌ Erro na Geração',
    body_template: 'Falha ao gerar {{generation_type}}. {{error_message}}',
    action_url: '/dashboard/generations',
    icon: '/icons/error.png',
    priority: 'high',
    expire_after: 7200,
    variables: ['generation_type', 'error_message']
  },
  {
    id: 'backup_complete',
    type: 'backup_complete',
    title_template: '💾 Backup Concluído',
    body_template: 'Backup automático concluído. {{items_count}} items salvos ({{size_mb}} MB).',
    action_url: '/dashboard/backup',
    icon: '/icons/backup.png',
    priority: 'low',
    expire_after: 1800,
    variables: ['items_count', 'size_mb']
  },
  {
    id: 'backup_failed',
    type: 'backup_failed',
    title_template: '⚠️ Falha no Backup',
    body_template: 'Erro durante backup automático: {{error_message}}',
    action_url: '/dashboard/backup',
    icon: '/icons/warning.png',
    priority: 'high',
    expire_after: 7200,
    variables: ['error_message']
  },
  {
    id: 'collaboration_invite',
    type: 'collaboration_invite',
    title_template: '🤝 Convite de Colaboração',
    body_template: '{{sender_name}} te convidou para colaborar no projeto "{{project_name}}".',
    action_url: '/dashboard/collaborations/{{invitation_id}}',
    icon: '/icons/collaboration.png',
    priority: 'normal',
    expire_after: 86400,
    variables: ['sender_name', 'project_name', 'invitation_id']
  },
  {
    id: 'security_alert',
    type: 'security_alert',
    title_template: '🔒 Alerta de Segurança',
    body_template: '{{alert_type}}: {{description}}. Verifique sua conta.',
    action_url: '/dashboard/security',
    icon: '/icons/security.png',
    priority: 'urgent',
    expire_after: 3600,
    variables: ['alert_type', 'description']
  },
  {
    id: 'usage_limit',
    type: 'usage_limit',
    title_template: '📊 Limite de Uso',
    body_template: 'Você usou {{percentage}}% do seu limite mensal de {{resource}}.',
    action_url: '/dashboard/usage',
    icon: '/icons/chart.png',
    priority: 'normal',
    expire_after: 7200,
    variables: ['percentage', 'resource']
  }
]

class NotificationManager {
  private supabase = createClient()
  private auditLogger = new AuditLogger()
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      // Register service worker for push notifications
      if ('serviceWorker' in navigator) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', this.serviceWorkerRegistration)
      }

      // Request notification permission
      await this.requestPermission()
    } catch (error) {
      console.error('Failed to initialize notifications:', error)
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  async subscribeToPush(userId: string): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered')
    }

    try {
      // Get VAPID public key from environment or API
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
        'BEl62iUYgUivxIkv69yViEuiBIa40HI2BuzDJjmQTxRgJQ4z3OdgTUi4xU7IiYWeFKBT7U0OHNKhzOxc7yCJCRE'

      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      })

      // Save subscription to database
      const subscriptionData: Omit<PushSubscription, 'id' | 'created_at'> = {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        active: true,
        last_used: new Date()
      }

      const { data, error } = await this.supabase
        .from('push_subscriptions')
        .upsert(subscriptionData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to save subscription: ${error.message}`)
      }

      await this.auditLogger.log(
        'notification_subscription_created',
        'system',
        { 
          subscription_id: data.id,
          platform: subscriptionData.platform
        },
        'info',
        userId
      )

      return data
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async unsubscribeFromPush(userId: string): Promise<boolean> {
    try {
      if (this.serviceWorkerRegistration) {
        const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
        }
      }

      // Deactivate subscriptions in database
      const { error } = await this.supabase
        .from('push_subscriptions')
        .update({ active: false })
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Failed to unsubscribe: ${error.message}`)
      }

      await this.auditLogger.log(
        'notification_subscription_removed',
        'system',
        {},
        'info',
        userId
      )

      return true
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  async sendNotification(
    userId: string, 
    type: keyof NotificationConfig['categories'],
    variables: Record<string, string> = {},
    options: {
      scheduled_for?: Date
      priority?: PushNotification['priority']
      channels?: Partial<PushNotification['channels']>
      data?: Record<string, any>
    } = {}
  ): Promise<string | null> {
    try {
      // Get user's notification preferences
      const config = await this.getNotificationConfig(userId)
      if (!config.enabled || !config.categories[type]) {
        return null
      }

      // Get notification template
      const template = DEFAULT_TEMPLATES.find(t => t.type === type)
      if (!template) {
        throw new Error(`No template found for notification type: ${type}`)
      }

      // Process template variables
      let title = template.title_template
      let body = template.body_template
      let actionUrl = template.action_url

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`
        title = title.replace(new RegExp(placeholder, 'g'), value)
        body = body.replace(new RegExp(placeholder, 'g'), value)
        if (actionUrl) {
          actionUrl = actionUrl.replace(new RegExp(placeholder, 'g'), value)
        }
      }

      // Create notification record
      const notification: Omit<PushNotification, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        type,
        title,
        body,
        icon: template.icon,
        badge: template.badge,
        action_url: actionUrl,
        data: options.data,
        priority: options.priority || template.priority,
        scheduled_for: options.scheduled_for,
        status: 'pending',
        channels: {
          push: config.desktop && (options.channels?.push !== false),
          email: config.email && (options.channels?.email !== false),
          sms: config.sms && (options.channels?.sms !== false),
          desktop: config.desktop && (options.channels?.desktop !== false)
        },
        metadata: {}
      }

      const { data, error } = await this.supabase
        .from('push_notifications')
        .insert(notification)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create notification: ${error.message}`)
      }

      // Send immediately if not scheduled
      if (!options.scheduled_for) {
        await this.processNotification(data.id)
      }

      return data.id
    } catch (error) {
      console.error('Failed to send notification:', error)
      return null
    }
  }

  private async processNotification(notificationId: string): Promise<void> {
    try {
      const { data: notification, error } = await this.supabase
        .from('push_notifications')
        .select('*')
        .eq('id', notificationId)
        .single()

      if (error || !notification) {
        throw new Error('Notification not found')
      }

      const results: Record<string, boolean> = {}

      // Send push notification
      if (notification.channels.push) {
        results.push = await this.sendPushNotification(notification)
      }

      // Send email notification
      if (notification.channels.email) {
        results.email = await this.sendEmailNotification(notification)
      }

      // Send SMS notification
      if (notification.channels.sms) {
        results.sms = await this.sendSMSNotification(notification)
      }

      // Show desktop notification
      if (notification.channels.desktop && typeof window !== 'undefined') {
        results.desktop = await this.showDesktopNotification(notification)
      }

      // Update notification status
      const hasSuccess = Object.values(results).some(Boolean)
      const status: PushNotification['status'] = hasSuccess ? 'sent' : 'failed'

      await this.supabase
        .from('push_notifications')
        .update({
          status,
          sent_at: new Date().toISOString(),
          metadata: {
            ...notification.metadata,
            delivery_results: results
          }
        })
        .eq('id', notificationId)

      await this.auditLogger.log(
        'notification_sent',
        'system',
        { 
          notification_id: notificationId,
          type: notification.type,
          channels: notification.channels,
          results
        },
        'info',
        notification.user_id
      )

    } catch (error) {
      console.error('Failed to process notification:', error)
      
      await this.supabase
        .from('push_notifications')
        .update({
          status: 'failed',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
        .eq('id', notificationId)
    }
  }

  private async sendPushNotification(notification: PushNotification): Promise<boolean> {
    try {
      // Get user's active push subscriptions
      const { data: subscriptions, error } = await this.supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', notification.user_id)
        .eq('active', true)

      if (error || !subscriptions?.length) {
        return false
      }

      const payload = {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/default.png',
        badge: notification.badge || '/icons/badge.png',
        data: {
          ...notification.data,
          action_url: notification.action_url,
          notification_id: notification.id
        }
      }

      // In a real implementation, this would use a service like Firebase Cloud Messaging
      // or a server-side push service. For now, we'll simulate the API call.
      
      for (const subscription of subscriptions) {
        try {
          // Simulate push API call
          const response = await fetch('/api/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              subscription: {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth
                }
              },
              payload
            })
          })

          if (!response.ok) {
            throw new Error(`Push API error: ${response.statusText}`)
          }
        } catch (error) {
          console.error('Failed to send push to subscription:', error)
        }
      }

      return true
    } catch (error) {
      console.error('Failed to send push notification:', error)
      return false
    }
  }

  private async sendEmailNotification(notification: PushNotification): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with an email service
      // like SendGrid, AWS SES, or similar
      console.log('Email notification would be sent:', notification)
      return true
    } catch (error) {
      console.error('Failed to send email notification:', error)
      return false
    }
  }

  private async sendSMSNotification(notification: PushNotification): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with an SMS service
      // like Twilio, AWS SNS, or similar
      console.log('SMS notification would be sent:', notification)
      return true
    } catch (error) {
      console.error('Failed to send SMS notification:', error)
      return false
    }
  }

  private async showDesktopNotification(notification: PushNotification): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission !== 'granted') {
      return false
    }

    try {
      const desktopNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        data: notification.data,
        requireInteraction: notification.priority === 'urgent'
      })

      if (notification.action_url) {
        desktopNotification.onclick = () => {
          window.open(notification.action_url!, '_blank')
          desktopNotification.close()
        }
      }

      return true
    } catch (error) {
      console.error('Failed to show desktop notification:', error)
      return false
    }
  }

  async getNotificationConfig(userId: string): Promise<NotificationConfig> {
    const { data } = await this.supabase
      .from('user_settings')
      .select('value')
      .eq('user_id', userId)
      .eq('key', 'notification_config')
      .single()

    return data?.value || {
      enabled: true,
      sound: true,
      vibration: true,
      desktop: true,
      email: false,
      sms: false,
      categories: {
        generation_complete: true,
        generation_failed: true,
        backup_complete: false,
        backup_failed: true,
        collaboration_invite: true,
        system_maintenance: true,
        security_alert: true,
        usage_limit: true,
        subscription_update: true
      }
    }
  }

  async updateNotificationConfig(userId: string, config: NotificationConfig): Promise<void> {
    const { error } = await this.supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        key: 'notification_config',
        value: config
      })

    if (error) {
      throw new Error(`Failed to update notification config: ${error.message}`)
    }

    await this.auditLogger.log(
      'notification_config_updated',
      'system',
      { config },
      'info',
      userId
    )
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('push_notifications')
      .update({
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId)

    return !error
  }

  async getNotifications(
    userId: string,
    options: {
      limit?: number
      offset?: number
      unread_only?: boolean
      type?: keyof NotificationConfig['categories']
    } = {}
  ): Promise<PushNotification[]> {
    let query = this.supabase
      .from('push_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options.unread_only) {
      query = query.is('read_at', null)
    }

    if (options.type) {
      query = query.eq('type', options.type)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get notifications: ${error.message}`)
    }

    return data || []
  }

  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const { data, error } = await this.supabase
      .from('push_notifications')
      .select('status, type, read_at')
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to get notification stats: ${error.message}`)
    }

    const notifications = data || []
    const stats: NotificationStats = {
      total_sent: 0,
      total_delivered: 0,
      total_failed: 0,
      total_read: 0,
      read_rate: 0,
      delivery_rate: 0,
      categories: {}
    }

    notifications.forEach(notification => {
      if (notification.status === 'sent' || notification.status === 'delivered') {
        stats.total_sent++
      }
      if (notification.status === 'delivered') {
        stats.total_delivered++
      }
      if (notification.status === 'failed') {
        stats.total_failed++
      }
      if (notification.read_at) {
        stats.total_read++
      }

      // Category stats
      if (!stats.categories[notification.type]) {
        stats.categories[notification.type] = { sent: 0, delivered: 0, read: 0 }
      }
      
      const category = stats.categories[notification.type]
      if (notification.status === 'sent' || notification.status === 'delivered') {
        category.sent++
      }
      if (notification.status === 'delivered') {
        category.delivered++
      }
      if (notification.read_at) {
        category.read++
      }
    })

    stats.read_rate = stats.total_sent > 0 ? (stats.total_read / stats.total_sent) * 100 : 0
    stats.delivery_rate = stats.total_sent > 0 ? (stats.total_delivered / stats.total_sent) * 100 : 0

    return stats
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return window.btoa(binary)
}

export const notificationManager = new NotificationManager()
export { NotificationManager }
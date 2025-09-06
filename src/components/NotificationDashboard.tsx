'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Bell,
  BellRing,
  BellOff,
  Settings,
  Smartphone,
  Mail,
  MessageSquare,
  Monitor,
  Volume2,
  VolumeX,
  Vibrate,
  Check,
  X,
  Clock,
  AlertCircle,
  BarChart3,
  Send,
  Eye,
  Trash2
} from 'lucide-react'
import { 
  notificationManager, 
  NotificationConfig, 
  PushNotification, 
  NotificationStats 
} from '@/lib/notifications'
import { useAuth } from '@/contexts/AuthContext'

export const NotificationDashboard: React.FC = () => {
  const { user } = useAuth()
  const [config, setConfig] = useState<NotificationConfig>({
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
  })
  const [notifications, setNotifications] = useState<PushNotification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default'>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [testNotification, setTestNotification] = useState({
    title: 'Teste de Notificação',
    body: 'Esta é uma notificação de teste do Creative AI Studio',
    type: 'generation_complete' as keyof NotificationConfig['categories']
  })

  useEffect(() => {
    if (user) {
      loadData()
      checkPermissionStatus()
      initializeNotifications()
    }
  }, [user])

  const loadData = async () => {
    try {
      if (!user) return

      // Load configuration
      const userConfig = await notificationManager.getNotificationConfig(user.id)
      setConfig(userConfig)

      // Load recent notifications
      const recentNotifications = await notificationManager.getNotifications(user.id, { limit: 50 })
      setNotifications(recentNotifications)

      // Load statistics
      const notificationStats = await notificationManager.getNotificationStats(user.id)
      setStats(notificationStats)

    } catch (error) {
      console.error('Failed to load notification data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkPermissionStatus = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermissionStatus('denied')
      return
    }

    setPermissionStatus(Notification.permission)
  }

  const initializeNotifications = async () => {
    try {
      await notificationManager.initialize()
      checkSubscriptionStatus()
    } catch (error) {
      console.error('Failed to initialize notifications:', error)
    }
  }

  const checkSubscriptionStatus = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    }
  }

  const requestPermission = async () => {
    const granted = await notificationManager.requestPermission()
    setPermissionStatus(granted ? 'granted' : 'denied')
  }

  const subscribeToPush = async () => {
    if (!user) return

    try {
      const subscription = await notificationManager.subscribeToPush(user.id)
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
    }
  }

  const unsubscribeFromPush = async () => {
    if (!user) return

    try {
      await notificationManager.unsubscribeFromPush(user.id)
      setIsSubscribed(false)
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
    }
  }

  const saveConfig = async () => {
    if (!user) return

    try {
      await notificationManager.updateNotificationConfig(user.id, config)
    } catch (error) {
      console.error('Failed to save notification config:', error)
    }
  }

  const sendTestNotification = async () => {
    if (!user) return

    try {
      await notificationManager.sendNotification(
        user.id,
        testNotification.type,
        {
          generation_type: 'imagem',
          prompt_preview: 'teste de notificação',
          generation_id: '123'
        }
      )
      
      // Refresh notifications list
      await loadData()
    } catch (error) {
      console.error('Failed to send test notification:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      await notificationManager.markAsRead(notificationId, user.id)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date() } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleString('pt-BR')
  }

  const getNotificationIcon = (type: keyof NotificationConfig['categories']) => {
    const icons = {
      generation_complete: Check,
      generation_failed: X,
      backup_complete: Check,
      backup_failed: AlertCircle,
      collaboration_invite: MessageSquare,
      system_maintenance: Settings,
      security_alert: AlertCircle,
      usage_limit: BarChart3,
      subscription_update: Bell
    }
    return icons[type] || Bell
  }

  const getCategoryLabel = (type: keyof NotificationConfig['categories']) => {
    const labels = {
      generation_complete: 'Geração Completa',
      generation_failed: 'Erro na Geração',
      backup_complete: 'Backup Completo',
      backup_failed: 'Erro no Backup',
      collaboration_invite: 'Convite de Colaboração',
      system_maintenance: 'Manutenção do Sistema',
      security_alert: 'Alerta de Segurança',
      usage_limit: 'Limite de Uso',
      subscription_update: 'Atualização da Assinatura'
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">Carregando notificações...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências de notificação e visualize o histórico
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Send className="w-4 h-4" />
                Testar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Notificação de Teste</DialogTitle>
                <DialogDescription>
                  Teste o sistema de notificações enviando uma notificação personalizada
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={testNotification.title}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    value={testNotification.body}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, body: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select 
                    value={testNotification.type} 
                    onValueChange={(type: any) => setTestNotification(prev => ({ ...prev, type }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(config.categories).map(type => (
                        <SelectItem key={type} value={type}>
                          {getCategoryLabel(type as keyof NotificationConfig['categories'])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={sendTestNotification} className="w-full">
                  Enviar Teste
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {permissionStatus !== 'granted' && (
            <Button onClick={requestPermission} className="gap-2">
              <Bell className="w-4 h-4" />
              Ativar Notificações
            </Button>
          )}
        </div>
      </div>

      {/* Permission Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {permissionStatus === 'granted' ? (
                <BellRing className="w-5 h-5 text-green-600" />
              ) : (
                <BellOff className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">
                  {permissionStatus === 'granted' ? 'Notificações Ativadas' : 'Notificações Desativadas'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {permissionStatus === 'granted' 
                    ? 'Você receberá notificações push no navegador'
                    : 'Permissão necessária para receber notificações'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={isSubscribed ? 'default' : 'secondary'}>
                {isSubscribed ? 'Inscrito' : 'Não inscrito'}
              </Badge>
              
              {permissionStatus === 'granted' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                >
                  {isSubscribed ? 'Desinscrever' : 'Inscrever'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Histórico</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Você não possui notificações ainda
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                return (
                  <Card 
                    key={notification.id} 
                    className={`transition-colors ${!notification.read_at ? 'border-blue-200 bg-blue-50/30' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-0.5">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{notification.title}</h4>
                              {!notification.read_at && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                  Nova
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(notification.type)}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.body}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(notification.created_at)}
                              </span>
                              
                              {notification.sent_at && (
                                <span>Enviado: {formatDate(notification.sent_at)}</span>
                              )}
                              
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  notification.status === 'sent' ? 'border-green-500 text-green-700' :
                                  notification.status === 'failed' ? 'border-red-500 text-red-700' :
                                  'border-yellow-500 text-yellow-700'
                                }`}
                              >
                                {notification.status === 'sent' && 'Enviado'}
                                {notification.status === 'failed' && 'Falhou'}
                                {notification.status === 'pending' && 'Pendente'}
                                {notification.status === 'delivered' && 'Entregue'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          {!notification.read_at && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {notification.action_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(notification.action_url!, '_blank')}
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Notificações Ativadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Controle principal das notificações
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    <Label>Som</Label>
                  </div>
                  <Switch
                    checked={config.sound}
                    onCheckedChange={(sound) => setConfig(prev => ({ ...prev, sound }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4" />
                    <Label>Vibração</Label>
                  </div>
                  <Switch
                    checked={config.vibration}
                    onCheckedChange={(vibration) => setConfig(prev => ({ ...prev, vibration }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    <Label>Desktop</Label>
                  </div>
                  <Switch
                    checked={config.desktop}
                    onCheckedChange={(desktop) => setConfig(prev => ({ ...prev, desktop }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <Label>Email</Label>
                  </div>
                  <Switch
                    checked={config.email}
                    onCheckedChange={(email) => setConfig(prev => ({ ...prev, email }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categorias de Notificação</CardTitle>
              <CardDescription>
                Escolha quais tipos de notificação você deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(config.categories).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm">
                      {getCategoryLabel(key as keyof NotificationConfig['categories'])}
                    </Label>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(value) => 
                        setConfig(prev => ({
                          ...prev,
                          categories: {
                            ...prev.categories,
                            [key]: value
                          }
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveConfig}>
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="statistics">
          {stats && (
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div>
                        <p className="text-2xl font-bold">{stats.total_sent}</p>
                        <p className="text-xs text-muted-foreground">Total Enviadas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div>
                        <p className="text-2xl font-bold">{stats.total_delivered}</p>
                        <p className="text-xs text-muted-foreground">Entregues</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div>
                        <p className="text-2xl font-bold">{stats.total_read}</p>
                        <p className="text-xs text-muted-foreground">Lidas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div>
                        <p className="text-2xl font-bold">{Math.round(stats.read_rate)}%</p>
                        <p className="text-xs text-muted-foreground">Taxa de Leitura</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.categories).map(([category, data]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{getCategoryLabel(category as keyof NotificationConfig['categories'])}</span>
                          <span>{data.sent} enviadas</span>
                        </div>
                        <div className="space-y-1">
                          <Progress 
                            value={data.sent > 0 ? (data.read / data.sent) * 100 : 0}
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{data.delivered} entregues</span>
                            <span>{data.read} lidas</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default NotificationDashboard
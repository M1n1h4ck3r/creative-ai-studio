'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  database: {
    status: 'connected' | 'disconnected' | 'slow'
    responseTime: number
    connections: number
  }
  cache: {
    status: 'connected' | 'disconnected'
    hitRate: number
    keys: number
  }
  apis: Array<{
    name: string
    status: 'online' | 'offline' | 'degraded'
    responseTime: number
    lastCheck: string
  }>
  performance: {
    avgResponseTime: number
    requestsPerMinute: number
    errorRate: number
  }
  activeUsers: number
  queueSize: number
}

interface SystemMonitorProps {
  className?: string
  refreshInterval?: number
}

export const SystemMonitor: React.FC<SystemMonitorProps> = ({ 
  className, 
  refreshInterval = 30000 
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchSystemHealth = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/system/health')
      
      if (!response.ok) {
        throw new Error('Failed to fetch system health')
      }

      const data = await response.json()
      setHealth(data)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSystemHealth()
    
    const interval = setInterval(fetchSystemHealth, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchSystemHealth, refreshInterval])

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'online':
        return 'text-green-600 bg-green-100'
      case 'warning':
      case 'slow':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'critical':
      case 'disconnected':
      case 'offline':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
      case 'slow':
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'critical':
      case 'disconnected':
      case 'offline':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" text="Carregando status do sistema..." />
      </div>
    )
  }

  if (error || !health) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">
            Erro ao carregar monitoramento: {error || 'Dados indisponíveis'}
          </p>
          <Button onClick={fetchSystemHealth} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Monitor do Sistema
          </h2>
          <p className="text-gray-600">
            Status em tempo real da aplicação
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Última atualização: {lastUpdate?.toLocaleTimeString('pt-BR')}
          </div>
          <Badge className={getStatusColor(health.status)}>
            {getStatusIcon(health.status)}
            <span className="ml-1 capitalize">{health.status}</span>
          </Badge>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatUptime(health.uptime)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {health.activeUsers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Requests/min
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {health.performance.requestsPerMinute}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Resp. Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {health.performance.avgResponseTime}ms
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Uso de Memória
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">RAM</span>
                <span className="text-sm text-gray-600">
                  {formatBytes(health.memory.used)} / {formatBytes(health.memory.total)}
                </span>
              </div>
              <Progress value={health.memory.percentage} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                {health.memory.percentage.toFixed(1)}% utilizado
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Status</span>
              <Badge className={getStatusColor(health.database.status)}>
                {health.database.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Tempo de Resposta</span>
              <span className="text-sm font-medium">
                {health.database.responseTime}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Conexões</span>
              <span className="text-sm font-medium">
                {health.database.connections}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cache Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Cache Redis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Status</span>
              <Badge className={getStatusColor(health.cache.status)}>
                {health.cache.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Hit Rate</span>
              <span className="text-sm font-medium">
                {health.cache.hitRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Chaves</span>
              <span className="text-sm font-medium">
                {health.cache.keys.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Taxa de Erro</span>
              <span className={`text-sm font-medium ${
                health.performance.errorRate > 5 ? 'text-red-600' : 'text-green-600'
              }`}>
                {health.performance.errorRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Fila</span>
              <span className="text-sm font-medium">
                {health.queueSize} jobs
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Status das APIs
          </CardTitle>
          <CardDescription>
            Monitoramento dos provedores de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {health.apis.map((api) => (
              <div 
                key={api.name}
                className="p-3 border rounded-lg space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{api.name}</span>
                  {getStatusIcon(api.status)}
                </div>
                <div className="text-sm text-gray-600">
                  Resposta: {api.responseTime}ms
                </div>
                <div className="text-xs text-gray-500">
                  Última verificação: {new Date(api.lastCheck).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchSystemHealth} variant="outline" className="gap-2">
          <Activity className="w-4 h-4" />
          Atualizar Status
        </Button>
      </div>
    </div>
  )
}

export default SystemMonitor
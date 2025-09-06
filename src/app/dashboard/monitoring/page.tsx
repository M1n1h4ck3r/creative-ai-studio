'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { monitoring } from '@/lib/monitoring'
import { 
  Activity, 
  AlertTriangle,
  ArrowLeft,
  Clock, 
  Eye, 
  RefreshCw, 
  Trash2,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'

interface StoredMetrics {
  performance: any[]
  errors: any[]
  actions: any[]
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<StoredMetrics>({ performance: [], errors: [], actions: [] })
  const [isLoading, setIsLoading] = useState(false)

  const loadMetrics = () => {
    setIsLoading(true)
    try {
      const storedMetrics = monitoring.getStoredMetrics()
      setMetrics(storedMetrics)
    } catch (error) {
      console.error('Failed to load metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados de monitoramento?')) {
      monitoring.clearStoredData()
      loadMetrics()
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR')
  }

  const formatDuration = (ms: number) => {
    return `${ms.toFixed(0)}ms`
  }

  const getPerformanceStats = () => {
    if (!metrics.performance.length) return { avgLoadTime: 0, slowPages: 0 }
    
    const loadTimes = metrics.performance.map(p => p.pageLoadTime).filter(t => t > 0)
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length || 0
    const slowPages = loadTimes.filter(t => t > 3000).length
    
    return { avgLoadTime, slowPages }
  }

  const getErrorStats = () => {
    const critical = metrics.errors.filter(e => 
      ['payment', 'auth', 'database', 'security'].some(keyword =>
        e.message.toLowerCase().includes(keyword)
      )
    ).length
    
    return { total: metrics.errors.length, critical }
  }

  const getTopActions = () => {
    const actionCounts: Record<string, number> = {}
    metrics.actions.forEach(action => {
      actionCounts[action.type] = (actionCounts[action.type] || 0) + 1
    })
    
    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }

  const performanceStats = getPerformanceStats()
  const errorStats = getErrorStats()
  const topActions = getTopActions()

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Monitoramento</h1>
          </div>
          <p className="text-muted-foreground">
            Acompanhe a performance e erros da aplicação
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={loadMetrics} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={clearAllData}>
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Dados
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Carregamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(performanceStats.avgLoadTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.performance.length} medições
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Páginas Lentas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {performanceStats.slowPages}
            </div>
            <p className="text-xs text-muted-foreground">
              &gt; 3 segundos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Erros</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {errorStats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {errorStats.critical} críticos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações do Usuário</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.actions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sessão: {monitoring.getSessionId().slice(-8)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Erros</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Métricas de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.performance.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma métrica de performance disponível
                </p>
              ) : (
                <div className="space-y-4">
                  {metrics.performance.slice(-10).reverse().map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{metric.url || 'Página'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(metric.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatDuration(metric.pageLoadTime)}
                        </p>
                        <Badge variant={metric.pageLoadTime > 3000 ? 'destructive' : metric.pageLoadTime > 1000 ? 'secondary' : 'default'}>
                          {metric.pageLoadTime > 3000 ? 'Lento' : metric.pageLoadTime > 1000 ? 'Médio' : 'Rápido'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Log de Erros
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.errors.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum erro registrado 🎉
                </p>
              ) : (
                <div className="space-y-4">
                  {metrics.errors.slice(-10).reverse().map((error, index) => {
                    const isCritical = ['payment', 'auth', 'database', 'security'].some(keyword =>
                      error.message.toLowerCase().includes(keyword)
                    )
                    
                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant={isCritical ? 'destructive' : 'secondary'}>
                            {isCritical ? 'Crítico' : 'Normal'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(error.timestamp)}
                          </span>
                        </div>
                        <p className="font-medium text-red-600 mb-1">{error.message}</p>
                        <p className="text-sm text-muted-foreground">{error.url}</p>
                        {error.stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-muted-foreground">
                              Ver stack trace
                            </summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                              {error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Ações Mais Comuns
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topActions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma ação registrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {topActions.map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="capitalize">{action.replace('_', ' ')}</span>
                        <Badge>{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Ações Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.actions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma ação registrada
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {metrics.actions.slice(-10).reverse().map((action, index) => (
                      <div key={index} className="flex items-center justify-between p-2 text-sm">
                        <div>
                          <span className="capitalize font-medium">
                            {action.type.replace('_', ' ')}
                          </span>
                          {action.payload?.path && (
                            <span className="text-muted-foreground ml-2">
                              {action.payload.path}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(action.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
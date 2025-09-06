'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Download, 
  Search, 
  Filter,
  User,
  Calendar,
  Eye,
  TrendingUp
} from 'lucide-react'
import { 
  AuditLog,
  AuditQuery,
  AuditStats,
  LogSeverity,
  LogCategory,
  auditLogger
} from '@/lib/audit'

interface AuditDashboardProps {
  className?: string
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({ className }) => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState<AuditQuery>({
    limit: 50,
    offset: 0
  })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  useEffect(() => {
    loadAuditData()
  }, [query])

  const loadAuditData = async () => {
    setLoading(true)
    try {
      const [logsResult, statsResult] = await Promise.all([
        auditLogger.query(query),
        auditLogger.getStats(query.start_date, query.end_date)
      ])
      
      setLogs(logsResult.logs)
      setStats(statsResult)
    } catch (error) {
      console.error('Failed to load audit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (search: string) => {
    setQuery(prev => ({ ...prev, search, offset: 0 }))
  }

  const handleFilterChange = (key: keyof AuditQuery, value: any) => {
    setQuery(prev => ({ ...prev, [key]: value, offset: 0 }))
  }

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const result = await auditLogger.exportLogs(query, format)
      if (result) {
        const blob = new Blob([result.data], { 
          type: format === 'json' ? 'application/json' : 'text/csv' 
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const getSeverityColor = (severity: LogSeverity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryIcon = (category: LogCategory) => {
    switch (category) {
      case 'security': return <Shield className="w-4 h-4" />
      case 'system': return <Activity className="w-4 h-4" />
      case 'user': return <User className="w-4 h-4" />
      case 'performance': return <TrendingUp className="w-4 h-4" />
      case 'business': return <Eye className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Auditoria e Logs
          </h2>
          <p className="text-gray-600">
            Monitoramento de atividades e eventos do sistema
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_logs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.by_severity.critical || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eventos de Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.by_category.security || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.by_user.length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar nos logs..."
                  className="pl-10"
                  value={query.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Severidade</label>
              <Select onValueChange={(value) => handleFilterChange('severity', value ? [value] : undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <Select onValueChange={(value) => handleFilterChange('category', value ? [value] : undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="security">Segurança</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="business">Negócio</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Input
                type="datetime-local"
                value={query.start_date?.slice(0, 16) || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value ? e.target.value + ':00.000Z' : undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs">Logs de Eventos</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Recentes</CardTitle>
              <CardDescription>
                Histórico detalhado de atividades do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getCategoryIcon(log.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <Badge className={getSeverityColor(log.severity)}>
                                {log.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {log.details.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{formatTimestamp(log.timestamp)}</span>
                              {log.user_id && <span>User: {log.user_id}</span>}
                              {log.ip_address && <span>IP: {log.ip_address}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.details.success ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum log encontrado com os filtros aplicados
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Action */}
              <Card>
                <CardHeader>
                  <CardTitle>Eventos por Ação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.by_action)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([action, count]) => (
                      <div key={action} className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Mais Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.by_user.slice(0, 10).map((user) => (
                      <div key={user.user_id} className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {user.user_id.slice(0, 8)}...
                        </span>
                        <Badge variant="secondary">{user.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Errors */}
              <Card>
                <CardHeader>
                  <CardTitle>Erros Mais Frequentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.top_errors.map((error, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <span className="text-sm font-medium truncate flex-1">
                          {error.error}
                        </span>
                        <Badge variant="secondary" className="ml-2">{error.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline de Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.by_date.slice(-7).map((day) => (
                      <div key={day.date} className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {new Date(day.date).toLocaleDateString('pt-BR')}
                        </span>
                        <Badge variant="secondary">{day.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Segurança</CardTitle>
              <CardDescription>
                Insights e alertas de segurança baseados nos logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Alertas de Segurança</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    {stats?.by_severity.critical || 0} eventos críticos detectados nas últimas 24 horas.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {stats?.by_action.login_failed || 0}
                    </div>
                    <div className="text-sm text-gray-600">Tentativas de login falharam</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats?.by_action.rate_limit_exceeded || 0}
                    </div>
                    <div className="text-sm text-gray-600">Rate limits excedidos</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.by_action.user_login || 0}
                    </div>
                    <div className="text-sm text-gray-600">Logins bem-sucedidos</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalhes do Log</h3>
                <Button variant="ghost" onClick={() => setSelectedLog(null)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ação</label>
                    <div className="font-mono text-sm">
                      {selectedLog.action}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo de Recurso</label>
                    <div className="font-mono text-sm">
                      {selectedLog.resource_type}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Descrição</label>
                  <div className="text-sm">
                    {selectedLog.details.description}
                  </div>
                </div>
                
                {selectedLog.details.error_message && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Erro</label>
                    <div className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded">
                      {selectedLog.details.error_message}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Metadados</label>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditDashboard
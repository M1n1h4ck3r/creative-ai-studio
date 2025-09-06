'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Activity,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Zap,
  Users,
  Globe,
  Calendar,
  BarChart3
} from 'lucide-react'
import { rateLimitManager, UserQuota } from '@/lib/rate-limiting'
import { useAuth } from '@/contexts/AuthContext'

interface UsageStats {
  total_requests: number
  successful_requests: number
  rate_limited_requests: number
  quota_exceeded_requests: number
  avg_response_time: number
  most_used_endpoints: Record<string, { requests: number; avg_response_time: number }>
  violations_by_type: Record<string, number>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export const RateLimitDashboard: React.FC = () => {
  const { user } = useAuth()
  const [quota, setQuota] = useState<UserQuota | null>(null)
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, selectedPeriod])

  const loadData = async () => {
    try {
      if (!user) return

      setLoading(true)
      
      // Load user quota
      const userQuota = await rateLimitManager.getUserQuota(user.id)
      setQuota(userQuota)

      // Load usage statistics
      const usageStats = await rateLimitManager.getUsageStats(user.id, selectedPeriod)
      setStats(usageStats)

    } catch (error) {
      console.error('Failed to load rate limit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'free': return 'bg-gray-100 text-gray-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      case 'custom': return 'bg-gold-100 text-gold-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanLabel = (planType: string) => {
    switch (planType) {
      case 'free': return 'Gratuito'
      case 'pro': return 'Profissional'
      case 'enterprise': return 'Empresarial'
      case 'custom': return 'Personalizado'
      default: return planType
    }
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  const formatEndpointName = (endpoint: string) => {
    return endpoint.replace('/api/', '').replace(/\//g, ' > ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">Carregando dados de uso...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Limites e Uso da API</h1>
          <p className="text-muted-foreground">
            Monitore seu uso da API e limites de taxa
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('day')}
          >
            24h
          </Button>
          <Button
            variant={selectedPeriod === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('week')}
          >
            7d
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('month')}
          >
            30d
          </Button>
        </div>
      </div>

      {quota && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Plano Atual
                </CardTitle>
                <CardDescription>
                  Seu plano e limites de uso
                </CardDescription>
              </div>
              <Badge className={getPlanColor(quota.plan_type)}>
                {getPlanLabel(quota.plan_type)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Gerações Diárias</span>
                  <span className={getUsageColor(getUsagePercentage(quota.usage.daily_generations_used, quota.daily_generations))}>
                    {quota.usage.daily_generations_used} / {quota.daily_generations}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(quota.usage.daily_generations_used, quota.daily_generations)}
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Gerações Mensais</span>
                  <span className={getUsageColor(getUsagePercentage(quota.usage.monthly_generations_used, quota.monthly_generations))}>
                    {quota.usage.monthly_generations_used} / {quota.monthly_generations}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(quota.usage.monthly_generations_used, quota.monthly_generations)}
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>API por Minuto</span>
                  <span className="text-blue-600">
                    {quota.api_calls_per_minute} req/min
                  </span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Requisições Simultâneas</span>
                  <span className="text-purple-600">
                    {quota.concurrent_requests} máx
                  </span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{stats?.total_requests || 0}</p>
                <p className="text-xs text-muted-foreground">Total de Requisições</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{stats?.successful_requests || 0}</p>
                <p className="text-xs text-muted-foreground">Requisições Bem-sucedidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{stats?.rate_limited_requests || 0}</p>
                <p className="text-xs text-muted-foreground">Limitadas por Taxa</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{Math.round(stats?.avg_response_time || 0)}ms</p>
                <p className="text-xs text-muted-foreground">Tempo Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Uso por Endpoint</TabsTrigger>
          <TabsTrigger value="violations">Violações</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Endpoints Mais Utilizados</CardTitle>
                <CardDescription>
                  Requisições por endpoint nos últimos {selectedPeriod === 'day' ? '24h' : selectedPeriod === 'week' ? '7 dias' : '30 dias'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.most_used_endpoints && Object.keys(stats.most_used_endpoints).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.most_used_endpoints)
                      .sort(([,a], [,b]) => b.requests - a.requests)
                      .slice(0, 5)
                      .map(([endpoint, data], index) => (
                        <div key={endpoint} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${COLORS[index % COLORS.length]}`} />
                            <span className="text-sm font-medium">
                              {formatEndpointName(endpoint)}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{data.requests}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round(data.avg_response_time)}ms avg
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado de uso disponível
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Requisições</CardTitle>
                <CardDescription>
                  Sucesso vs limitações de taxa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats && stats.total_requests > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Bem-sucedidas', value: stats.successful_requests, fill: '#22C55E' },
                          { name: 'Limitadas', value: stats.rate_limited_requests, fill: '#EF4444' },
                          { name: 'Quota Excedida', value: stats.quota_exceeded_requests, fill: '#F59E0B' }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Violações de Rate Limit
              </CardTitle>
              <CardDescription>
                Tipos de violações nos últimos {selectedPeriod === 'day' ? '24h' : selectedPeriod === 'week' ? '7 dias' : '30 dias'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.violations_by_type && Object.keys(stats.violations_by_type).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.violations_by_type).map(([type, count], index) => {
                    const typeLabels: Record<string, string> = {
                      'rate_limit': 'Limite de Taxa',
                      'quota_exceeded': 'Quota Excedida',
                      'concurrent_limit': 'Limite Simultâneo',
                      'blacklisted': 'IP Bloqueado'
                    }
                    
                    return (
                      <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="font-medium">
                            {typeLabels[type] || type}
                          </span>
                        </div>
                        <Badge variant="destructive">
                          {count} violações
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-lg font-medium text-green-600">Nenhuma Violação!</p>
                  <p className="text-muted-foreground">
                    Você está dentro dos seus limites de uso
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tendências de Uso
              </CardTitle>
              <CardDescription>
                Análise temporal do seu uso da API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3" />
                <p>Gráficos de tendência em desenvolvimento</p>
                <p className="text-sm">
                  Dados históricos detalhados estarão disponíveis em breve
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {quota && (
        <Card>
          <CardHeader>
            <CardTitle>Recursos do Plano</CardTitle>
            <CardDescription>
              Funcionalidades disponíveis no seu plano atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quota.features.map((feature, index) => {
                const featureLabels: Record<string, string> = {
                  'basic_generation': 'Geração Básica',
                  'advanced_generation': 'Geração Avançada',
                  'templates': 'Templates',
                  'collaboration': 'Colaboração',
                  'backup': 'Backup',
                  'audit': 'Auditoria',
                  'priority_support': 'Suporte Prioritário',
                  'all': 'Todas as Funcionalidades'
                }
                
                return (
                  <Badge key={index} variant="secondary" className="justify-center">
                    {featureLabels[feature] || feature}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RateLimitDashboard
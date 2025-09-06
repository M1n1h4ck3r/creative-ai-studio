'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/loading'
import { analytics } from '@/lib/analytics'

interface AnalyticsData {
  events: Array<{
    id: string
    event_name: string
    properties: Record<string, any>
    created_at: string
    user_agent?: string
  }>
  summary: Record<string, number>
  total_events: number
  date_range: {
    start_date: string
    end_date: string
  }
}

interface AnalyticsDashboardProps {
  className?: string
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('7d')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const startDate = new Date()
      switch (dateRange) {
        case '1d':
          startDate.setDate(startDate.getDate() - 1)
          break
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        default:
          startDate.setDate(startDate.getDate() - 7)
      }

      const response = await fetch(
        `/api/analytics?start_date=${startDate.toISOString()}&end_date=${new Date().toISOString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const analyticsData = await response.json()
      setData(analyticsData)

      // Track dashboard view
      analytics.performance.pageLoad('analytics_dashboard', Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      analytics.error.caught(new Error('Analytics dashboard fetch failed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const getTopEvents = () => {
    if (!data?.summary) return []
    
    return Object.entries(data.summary)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({
        event: event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count
      }))
  }

  const getRecentEvents = () => {
    return data?.events?.slice(0, 20) || []
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" text="Carregando analytics..." />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar analytics: {error}</p>
          <Button onClick={fetchAnalytics} variant="outline">
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
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">
            Insights sobre o uso da aplicação
          </p>
        </div>
        
        <div className="flex space-x-2">
          {['1d', '7d', '30d'].map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {range === '1d' ? '1 dia' : range === '7d' ? '7 dias' : '30 dias'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total de Eventos</CardTitle>
            <CardDescription>Últimos {dateRange}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {data?.total_events || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de Eventos</CardTitle>
            <CardDescription>Diferentes ações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {Object.keys(data?.summary || {}).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evento Mais Comum</CardTitle>
            <CardDescription>Ação mais frequente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-purple-600">
              {getTopEvents()[0]?.event || 'Nenhum evento'}
            </div>
            <div className="text-sm text-gray-600">
              {getTopEvents()[0]?.count || 0} ocorrências
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Events */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos Mais Frequentes</CardTitle>
            <CardDescription>Top 10 ações dos usuários</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getTopEvents().map(({ event, count }, index) => (
                <div key={event} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500 w-6">
                      {index + 1}
                    </span>
                    <span className="font-medium">{event}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="bg-blue-200 h-2 rounded"
                      style={{ 
                        width: `${Math.max(20, (count / (getTopEvents()[0]?.count || 1)) * 100)}px` 
                      }}
                    />
                    <span className="text-sm text-gray-600 min-w-[30px]">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos Recentes</CardTitle>
            <CardDescription>Últimas 20 ações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getRecentEvents().map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {event.event_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(event.created_at)}
                    </p>
                    {event.properties && Object.keys(event.properties).length > 0 && (
                      <div className="mt-1">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-400 hover:text-gray-600">
                            Propriedades
                          </summary>
                          <pre className="mt-1 p-1 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(event.properties, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchAnalytics} variant="outline">
          🔄 Atualizar Dados
        </Button>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import {
  Activity,
  Users,
  TrendingUp,
  Eye,
  Clock,
  Zap,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'
import { format } from 'date-fns'

interface AnalyticsData {
  events: any[]
  summary: Record<string, number>
  total_events: number
  date_range: {
    start_date: string
    end_date: string
  }
}

interface MetricCard {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
}

export const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('all')

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe, selectedMetric])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      // Calculate date range based on timeframe
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeframe) {
        case '1h':
          startDate.setHours(endDate.getHours() - 1)
          break
        case '24h':
          startDate.setDate(endDate.getDate() - 1)
          break
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
      }
      
      params.set('start_date', startDate.toISOString())
      params.set('end_date', endDate.toISOString())
      
      if (selectedMetric !== 'all') {
        params.set('event_type', selectedMetric)
      }

      const response = await fetch(`/api/analytics?${params}`)
      if (response.ok) {
        const analytics = await response.json()
        setData(analytics)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const processChartData = () => {
    if (!data?.events) return []

    const dailyData: Record<string, Record<string, number>> = {}
    
    data.events.forEach(event => {
      const date = format(new Date(event.created_at), 'MMM dd')
      if (!dailyData[date]) {
        dailyData[date] = {}
      }
      dailyData[date][event.event_name] = (dailyData[date][event.event_name] || 0) + 1
    })

    return Object.entries(dailyData).map(([date, events]) => ({
      date,
      ...events,
      total: Object.values(events).reduce((sum, count) => sum + count, 0)
    }))
  }

  const getTopEvents = () => {
    if (!data?.summary) return []

    return Object.entries(data.summary)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([event, count]) => ({
        name: event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        percentage: Math.round((count / data.total_events) * 100)
      }))
  }

  const calculateMetrics = (): MetricCard[] => {
    if (!data) return []

    const generationEvents = data.events.filter(e => 
      e.event_name.includes('generation') || e.event_name.includes('image')
    )
    
    const userSessions = new Set(data.events.map(e => e.session_id)).size
    const avgEventsPerSession = data.total_events / Math.max(userSessions, 1)

    return [
      {
        title: 'Total Events',
        value: data.total_events.toLocaleString(),
        trend: 'up',
        change: '+12%',
        icon: <Activity className="h-4 w-4" />
      },
      {
        title: 'Active Sessions',
        value: userSessions,
        trend: 'up',
        change: '+8%',
        icon: <Users className="h-4 w-4" />
      },
      {
        title: 'Generations',
        value: generationEvents.length,
        trend: 'up',
        change: '+15%',
        icon: <Zap className="h-4 w-4" />
      },
      {
        title: 'Events/Session',
        value: avgEventsPerSession.toFixed(1),
        trend: 'neutral',
        icon: <TrendingUp className="h-4 w-4" />
      }
    ]
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Track usage patterns and performance metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchAnalytics} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {calculateMetrics().map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && (
                <p className={`text-xs ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {metric.change} from last period
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events Over Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Events Over Time
            </CardTitle>
            <CardDescription>
              Daily event count for the selected timeframe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={processChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Events Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2" />
              Top Events
            </CardTitle>
            <CardDescription>
              Most frequent events in your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getTopEvents()}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getTopEvents().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-2">
                {getTopEvents().map((event, index) => (
                  <div key={event.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{event.name}</span>
                    </div>
                    <Badge variant="secondary">
                      {event.percentage}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Events
          </CardTitle>
          <CardDescription>
            Latest {data?.events.length || 0} events from your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data?.events.slice(0, 50).map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">
                    {event.event_name.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(event.created_at), 'MMM dd, HH:mm')}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Session: {event.session_id?.slice(-8)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsDashboard
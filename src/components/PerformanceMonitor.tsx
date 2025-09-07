'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Database, 
  Gauge, 
  RefreshCw, 
  Server, 
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface PerformanceMetrics {
  cacheHitRate: number
  averageResponseTime: number
  totalRequests: number
  errorRate: number
  activeConnections: number
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  cacheStats: {
    imageCache: { size: number; hitRate: number }
    costCache: { size: number; hitRate: number }
    providerCache: { size: number; hitRate: number }
  }
  providerStats: Array<{
    name: string
    status: 'healthy' | 'warning' | 'error'
    responseTime: number
    successRate: number
    lastError?: string
  }>
}

interface PerformanceMonitorProps {
  className?: string
}

const mockMetrics: PerformanceMetrics = {
  cacheHitRate: 85.2,
  averageResponseTime: 1.25,
  totalRequests: 15432,
  errorRate: 0.8,
  activeConnections: 12,
  memoryUsage: {
    used: 145,
    total: 512,
    percentage: 28.3
  },
  cacheStats: {
    imageCache: { size: 1205, hitRate: 78.4 },
    costCache: { size: 342, hitRate: 92.1 },
    providerCache: { size: 45, hitRate: 85.7 }
  },
  providerStats: [
    {
      name: 'OpenAI DALL-E',
      status: 'healthy',
      responseTime: 2.1,
      successRate: 98.5
    },
    {
      name: 'Google Gemini',
      status: 'healthy',
      responseTime: 1.8,
      successRate: 97.2
    },
    {
      name: 'Anthropic Claude',
      status: 'warning',
      responseTime: 3.2,
      successRate: 94.1,
      lastError: 'Rate limit exceeded'
    },
    {
      name: 'Stability AI',
      status: 'error',
      responseTime: 5.4,
      successRate: 82.3,
      lastError: 'Connection timeout'
    }
  ]
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDuration = (seconds: number): string => {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`
  return `${seconds.toFixed(2)}s`
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'text-green-600'
    case 'warning': return 'text-yellow-600'
    case 'error': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case 'error': return <XCircle className="h-4 w-4 text-red-600" />
    default: return <Clock className="h-4 w-4 text-gray-600" />
  }
}

export default function PerformanceMonitor({ className }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(mockMetrics)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (autoRefresh) {
      interval = setInterval(() => {
        refreshMetrics()
      }, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const refreshMetrics = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, this would fetch from your metrics API
      // const response = await fetch('/api/metrics')
      // const data = await response.json()
      // setMetrics(data)
      
      // For now, simulate slight changes in mock data
      const updatedMetrics = {
        ...mockMetrics,
        cacheHitRate: mockMetrics.cacheHitRate + (Math.random() - 0.5) * 5,
        averageResponseTime: Math.max(0.5, mockMetrics.averageResponseTime + (Math.random() - 0.5) * 0.5),
        totalRequests: mockMetrics.totalRequests + Math.floor(Math.random() * 100),
        errorRate: Math.max(0, mockMetrics.errorRate + (Math.random() - 0.5) * 0.3),
        activeConnections: Math.max(0, mockMetrics.activeConnections + Math.floor((Math.random() - 0.5) * 10))
      }
      
      setMetrics(updatedMetrics)
      setLastUpdated(new Date())
      toast.success('Metrics refreshed')
    } catch (error) {
      toast.error('Failed to refresh metrics')
    } finally {
      setIsLoading(false)
    }
  }

  const clearCache = async (cacheType?: string) => {
    setIsLoading(true)
    try {
      // In a real implementation:
      // const response = await fetch('/api/cache/clear', {
      //   method: 'POST',
      //   body: JSON.stringify({ type: cacheType })
      // })
      
      toast.success(`Cache cleared${cacheType ? ` (${cacheType})` : ''}`)
      await refreshMetrics()
    } catch (error) {
      toast.error('Failed to clear cache')
    } finally {
      setIsLoading(false)
    }
  }

  const restartProvider = async (providerName: string) => {
    setIsLoading(true)
    try {
      // In a real implementation:
      // const response = await fetch(`/api/providers/${providerName}/restart`, {
      //   method: 'POST'
      // })
      
      toast.success(`${providerName} restarted`)
      await refreshMetrics()
    } catch (error) {
      toast.error(`Failed to restart ${providerName}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Performance Monitor</span>
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Real-time system performance and health metrics</span>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshMetrics}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{metrics.cacheHitRate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Cache Hit Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{formatDuration(metrics.averageResponseTime)}</p>
                      <p className="text-xs text-muted-foreground">Avg Response Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Requests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className={`h-8 w-8 ${metrics.errorRate > 2 ? 'text-red-500' : 'text-yellow-500'}`} />
                    <div>
                      <p className="text-2xl font-bold">{metrics.errorRate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Error Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Alerts */}
            <div className="space-y-2">
              {metrics.errorRate > 2 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    High error rate detected ({metrics.errorRate.toFixed(1)}%). Consider investigating provider issues.
                  </AlertDescription>
                </Alert>
              )}

              {metrics.averageResponseTime > 3 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Response times are slower than usual ({formatDuration(metrics.averageResponseTime)}). Check system resources.
                  </AlertDescription>
                </Alert>
              )}

              {metrics.cacheHitRate < 70 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Database className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Low cache hit rate ({metrics.cacheHitRate.toFixed(1)}%). Consider cache optimization.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-muted-foreground">
                      {formatBytes(metrics.memoryUsage.used * 1024 * 1024)} / {formatBytes(metrics.memoryUsage.total * 1024 * 1024)}
                    </span>
                  </div>
                  <Progress value={metrics.memoryUsage.percentage} />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Connections</span>
                  <Badge variant="outline">{metrics.activeConnections}</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Auto Refresh</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                  >
                    {autoRefresh ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cache Tab */}
          <TabsContent value="cache" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Cache Performance</h3>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => clearCache('image')}>
                  Clear Image Cache
                </Button>
                <Button variant="outline" size="sm" onClick={() => clearCache()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Image Cache</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Entries</span>
                      <span className="text-sm font-medium">{metrics.cacheStats.imageCache.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hit Rate</span>
                      <span className="text-sm font-medium">{metrics.cacheStats.imageCache.hitRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.cacheStats.imageCache.hitRate} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cost Cache</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Entries</span>
                      <span className="text-sm font-medium">{metrics.cacheStats.costCache.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hit Rate</span>
                      <span className="text-sm font-medium">{metrics.cacheStats.costCache.hitRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.cacheStats.costCache.hitRate} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Provider Cache</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Entries</span>
                      <span className="text-sm font-medium">{metrics.cacheStats.providerCache.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Hit Rate</span>
                      <span className="text-sm font-medium">{metrics.cacheStats.providerCache.hitRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.cacheStats.providerCache.hitRate} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cache Optimization Tips */}
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                <strong>Cache Optimization Tips:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Image cache hit rate above 80% is excellent</li>
                  <li>Cost cache should have very high hit rates (90%+)</li>
                  <li>Clear cache if memory usage is high</li>
                  <li>Consider increasing cache size for frequently used prompts</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-4">
            <h3 className="text-lg font-semibold">AI Provider Status</h3>
            
            <div className="space-y-2">
              {metrics.providerStats.map((provider) => (
                <Card key={provider.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(provider.status)}
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Response: {formatDuration(provider.responseTime)}</span>
                            <span>Success: {provider.successRate.toFixed(1)}%</span>
                            {provider.lastError && (
                              <span className="text-red-600">{provider.lastError}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          provider.status === 'healthy' ? 'default' :
                          provider.status === 'warning' ? 'secondary' : 
                          'destructive'
                        }>
                          {provider.status}
                        </Badge>
                        {provider.status !== 'healthy' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restartProvider(provider.name)}
                            disabled={isLoading}
                          >
                            Restart
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Success Rate</span>
                        <span>{provider.successRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={provider.successRate} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-4">
            <h3 className="text-lg font-semibold">System Resources</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Gauge className="h-4 w-4" />
                    <span>Memory Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Used Memory</span>
                    <span className="text-sm font-medium">
                      {formatBytes(metrics.memoryUsage.used * 1024 * 1024)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Memory</span>
                    <span className="text-sm font-medium">
                      {formatBytes(metrics.memoryUsage.total * 1024 * 1024)}
                    </span>
                  </div>
                  <Progress value={metrics.memoryUsage.percentage} />
                  <p className="text-xs text-muted-foreground">
                    {metrics.memoryUsage.percentage.toFixed(1)}% of available memory in use
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Server className="h-4 w-4" />
                    <span>Server Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Connections</span>
                    <Badge variant="outline">{metrics.activeConnections}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Requests</span>
                    <Badge variant="outline">{metrics.totalRequests.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Uptime</span>
                    <Badge variant="outline">24h 15m</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Environment</span>
                    <Badge variant="outline">Production</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resource Recommendations */}
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Performance Recommendations:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  {metrics.memoryUsage.percentage > 80 && (
                    <li>Memory usage is high - consider increasing server memory or optimizing cache</li>
                  )}
                  {metrics.averageResponseTime > 2 && (
                    <li>Response times are slow - check provider performance and network connectivity</li>
                  )}
                  {metrics.errorRate > 1 && (
                    <li>Error rate is elevated - review logs and provider configurations</li>
                  )}
                  <li>Consider implementing Redis caching for better performance</li>
                  <li>Monitor during peak usage hours for capacity planning</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
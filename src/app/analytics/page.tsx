'use client'

import { Suspense } from 'react'
import { Layout } from 'antd'
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard'
import AntHeader from '@/components/ui/ant-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const { Content } = Layout

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-96" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
            <div className="h-10 bg-gray-200 rounded animate-pulse w-24" />
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-64" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <AntHeader 
        title="Creative AI Studio" 
        subtitle="Analytics e Métricas" 
        showNavigation={true} 
      />
      <Content style={{ padding: '24px' }}>
        <Suspense fallback={<LoadingSkeleton />}>
          <AnalyticsDashboard />
        </Suspense>
      </Content>
    </Layout>
  )
}
'use client'

import { Suspense } from 'react'
import PerformanceMonitor from '@/components/PerformanceMonitor'

export default function MonitoringPage() {

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system performance, API usage, and health metrics
        </p>
      </div>

      <Suspense fallback={<div>Loading monitoring dashboard...</div>}>
        <PerformanceMonitor />
      </Suspense>
    </div>
  )
}
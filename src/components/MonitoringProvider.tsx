'use client'

import { useMonitoring } from '@/hooks/useMonitoring'

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  // Enable monitoring with conservative settings
  useMonitoring({
    trackPageViews: true,
    trackUserActions: true,
    trackPerformance: true,
    enabled: true
  })

  return <>{children}</>
}
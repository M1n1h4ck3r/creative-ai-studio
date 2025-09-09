'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

export default function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Track page view
    trackEvent('page_view', {
      page: pathname,
      timestamp: new Date().toISOString(),
      referrer: typeof document !== 'undefined' ? document.referrer : undefined
    })
  }, [pathname])

  return null
}
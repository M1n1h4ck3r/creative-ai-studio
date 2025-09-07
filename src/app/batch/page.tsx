'use client'

import { Suspense } from 'react'
import BatchProcessor from '@/components/BatchProcessor'

export default function BatchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <BatchProcessor />
      </Suspense>
    </div>
  )
}
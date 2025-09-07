'use client'

import { Suspense } from 'react'
import DeveloperAPI from '@/components/DeveloperAPI'

export default function DeveloperPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Developer API</h1>
        <p className="text-muted-foreground mt-2">
          Integrate Creative AI Studio into your applications with our REST API
        </p>
      </div>
      
      <Suspense fallback={<div>Loading developer tools...</div>}>
        <DeveloperAPI />
      </Suspense>
    </div>
  )
}
'use client'

import { Suspense } from 'react'
import TeamCollaboration from '@/components/TeamCollaboration'

export default function TeamPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Team Collaboration</h1>
        <p className="text-muted-foreground mt-2">
          Manage your team, projects, and collaborate on creative assets
        </p>
      </div>
      
      <Suspense fallback={<div>Loading team...</div>}>
        <TeamCollaboration />
      </Suspense>
    </div>
  )
}
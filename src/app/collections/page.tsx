'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import ImageCollections from '@/components/ImageCollections'

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-24" />
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CollectionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Coleções</h1>
        </div>
        <p className="text-muted-foreground">
          Organize e gerencie suas imagens favoritas em coleções temáticas
        </p>
      </div>
      
      <Suspense fallback={<LoadingSkeleton />}>
        <ImageCollections />
      </Suspense>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Suspense } from 'react'
import ImageEditor from '@/components/ImageEditor'
import { useToast } from '@/components/ui/use-toast'

export default function EditorPage() {
  const { toast } = useToast()
  
  const handleSave = (editedImage: string) => {
    // Here you could save to history, database, etc.
    console.log('Saving edited image:', editedImage)
  }

  const handleGenerate = async (prompt: string, options: any): Promise<string> => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          provider: 'openai', // Default provider for variations
          aspectRatio: '1:1',
          ...options
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const data = await response.json()
      return data.imageUrl || data.url || ''
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate image variation",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Image Editor</h1>
        <p className="text-muted-foreground mt-2">
          Edit, enhance, and create variations of your images with AI
        </p>
      </div>
      
      <Suspense fallback={<div>Loading editor...</div>}>
        <ImageEditor 
          onSave={handleSave}
          onGenerate={handleGenerate}
        />
      </Suspense>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function TestGeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')

  const generateImage = async () => {
    if (!prompt.trim()) return
    
    setLoading(true)
    setError('')
    setImageUrl('')
    
    try {
      const response = await fetch('/api/test-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio: '1:1'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setImageUrl(result.imageUrl)
      } else {
        setError(result.error || 'Erro na geração')
      }
    } catch (err: any) {
      setError('Erro: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Teste de Geração - Gemini 2.5 Flash Image</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gerar Imagem</CardTitle>
            <CardDescription>Teste usando API key do .env</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Digite seu prompt aqui..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
            <Button 
              onClick={generateImage} 
              disabled={loading || !prompt.trim()}
              className="w-full"
            >
              {loading ? 'Gerando...' : 'Gerar Imagem'}
            </Button>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                <div className="text-gray-500">Gerando...</div>
              </div>
            )}
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={prompt}
                width={400}
                height={400}
                className="w-full rounded"
              />
            )}
            {!loading && !imageUrl && (
              <div className="aspect-square bg-gray-50 rounded flex items-center justify-center">
                <div className="text-gray-400">Imagem aparecerá aqui</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
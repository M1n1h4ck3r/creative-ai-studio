'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, Settings, Upload, X } from 'lucide-react'
import Image from 'next/image'

export default function TestGeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const [attachedFiles, setAttachedFiles] = useState<any[]>([])

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
          aspectRatio: '1:1',
          temperature,
          attachedFiles
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

  const downloadImage = () => {
    if (!imageUrl) return
    
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `gemini-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newFiles: any[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        newFiles.push({
          id: Date.now() + Math.random(),
          name: file.name,
          data: base64.split(',')[1],
          type: file.type,
          preview: base64
        })
        setAttachedFiles([...attachedFiles, ...newFiles])
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Teste de Geração - Gemini 2.5 Flash Image</h1>
      
      {/* Advanced Controls */}
      <Card className="mb-6">
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>🎛️ Controles Avançados do Gemini</CardTitle>
                  {attachedFiles.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {attachedFiles.length} arquivo(s)
                    </span>
                  )}
                </div>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              <CardDescription>
                Configure parâmetros de geração e anexe arquivos de referência
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Anexar Imagens</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Anexar Imagens
                  </Button>
                </div>
                
                {attachedFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="relative group">
                        <img src={file.preview} alt={file.name} className="w-full h-16 object-cover rounded" />
                        <button
                          onClick={() => setAttachedFiles(attachedFiles.filter(f => f.id !== file.id))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Temperature Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature: {temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Controla criatividade. Baixo (&lt; 0.5) = focado, Alto (&gt;= 0.5) = criativo
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
      
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
          <CardContent className="space-y-4">
            {loading && (
              <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                <div className="text-gray-500">Gerando...</div>
              </div>
            )}
            {imageUrl && (
              <div className="space-y-4">
                <Image
                  src={imageUrl}
                  alt={prompt}
                  width={400}
                  height={400}
                  className="w-full rounded"
                />
                <Button 
                  onClick={downloadImage}
                  variant="outline"
                  className="w-full"
                >
                  Download Imagem
                </Button>
              </div>
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
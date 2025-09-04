'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, Trash2, History, Eye } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  provider: string
  aspectRatio: string
  timestamp: number
  metadata?: any
}

export default function ImageHistory() {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)

  useEffect(() => {
    // Load images from localStorage
    const savedImages = localStorage.getItem('generated-images')
    if (savedImages) {
      try {
        const parsedImages = JSON.parse(savedImages)
        setImages(parsedImages.reverse()) // Most recent first
      } catch (error) {
        console.error('Error loading image history:', error)
      }
    }
  }, [])

  const saveToHistory = (image: Omit<GeneratedImage, 'id' | 'timestamp'>) => {
    const newImage: GeneratedImage = {
      ...image,
      id: Date.now().toString(),
      timestamp: Date.now()
    }

    const updatedImages = [newImage, ...images].slice(0, 50) // Keep only last 50 images
    setImages(updatedImages)
    localStorage.setItem('generated-images', JSON.stringify(updatedImages))
  }

  const downloadImage = (image: GeneratedImage) => {
    try {
      const a = document.createElement('a')
      a.href = image.url
      a.download = `${image.provider}-image-${image.timestamp}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('Download iniciado!')
    } catch (error) {
      toast.error('Erro ao fazer download')
    }
  }

  const deleteImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId)
    setImages(updatedImages)
    localStorage.setItem('generated-images', JSON.stringify(updatedImages))
    if (selectedImage?.id === imageId) {
      setSelectedImage(null)
    }
    toast.success('Imagem removida do histórico')
  }

  const clearHistory = () => {
    setImages([])
    setSelectedImage(null)
    localStorage.removeItem('generated-images')
    toast.success('Histórico limpo')
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR')
  }

  // Expose saveToHistory globally for other components to use
  useEffect(() => {
    (window as any).saveImageToHistory = saveToHistory
    return () => {
      delete (window as any).saveImageToHistory
    }
  }, [images])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Image List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <CardTitle>Histórico</CardTitle>
              </div>
              {images.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {images.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma imagem gerada ainda</p>
                <p className="text-sm">Suas imagens aparecerão aqui</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 p-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className={`relative group cursor-pointer rounded-lg border transition-colors hover:bg-muted/50 ${
                        selectedImage?.id === image.id ? 'bg-muted border-primary' : ''
                      }`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <div className="p-3">
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <Image
                              src={image.url}
                              alt={image.prompt}
                              width={60}
                              height={60}
                              className="rounded object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {image.prompt.substring(0, 50)}...
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {image.provider}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {image.aspectRatio}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(image.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                downloadImage(image)
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteImage(image.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Image Preview */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <CardTitle>Preview</CardTitle>
              </div>
              {selectedImage && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadImage(selectedImage)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteImage(selectedImage.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedImage ? (
              <div className="space-y-4">
                <div className="relative">
                  <Image
                    src={selectedImage.url}
                    alt={selectedImage.prompt}
                    width={600}
                    height={600}
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">Prompt:</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedImage.prompt}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-sm font-medium">Provider: </span>
                      <Badge variant="outline" className="capitalize">
                        {selectedImage.provider}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Formato: </span>
                      <Badge variant="secondary">
                        {selectedImage.aspectRatio}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Gerado em: </span>
                    <span className="text-sm text-muted-foreground">
                      {formatTimestamp(selectedImage.timestamp)}
                    </span>
                  </div>
                  {selectedImage.metadata && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {selectedImage.metadata.generationTime && (
                        <div>Tempo: {selectedImage.metadata.generationTime}ms</div>
                      )}
                      {selectedImage.metadata.cost && (
                        <div>Custo: ${selectedImage.metadata.cost.toFixed(4)}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-muted-foreground">
                    Selecione uma imagem para visualizar
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
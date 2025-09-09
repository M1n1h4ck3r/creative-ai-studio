'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { 
  Heart, 
  HeartOff,
  Plus, 
  Folder, 
  FolderOpen,
  Edit3,
  Trash2,
  MoreVertical,
  Star,
  BookOpen,
  Grid3x3,
  Image as ImageIcon
} from 'lucide-react'
import Image from 'next/image'
import { analytics } from '@/lib/analytics'

interface Collection {
  id: string
  name: string
  description?: string
  color: string
  images: SavedImage[]
  createdAt: number
  updatedAt: number
  isDefault?: boolean
}

interface SavedImage {
  id: string
  url: string
  prompt: string
  provider: string
  aspectRatio?: string
  metadata?: any
  addedAt: number
  isFavorite?: boolean
}

interface ImageCollectionsProps {
  currentImage?: {
    url: string
    prompt: string
    provider: string
    metadata?: any
  }
}

const defaultColors = [
  { name: 'Blue', value: 'bg-blue-500', light: 'bg-blue-100' },
  { name: 'Green', value: 'bg-green-500', light: 'bg-green-100' },
  { name: 'Purple', value: 'bg-purple-500', light: 'bg-purple-100' },
  { name: 'Orange', value: 'bg-orange-500', light: 'bg-orange-100' },
  { name: 'Pink', value: 'bg-pink-500', light: 'bg-pink-100' },
  { name: 'Yellow', value: 'bg-yellow-500', light: 'bg-yellow-100' },
  { name: 'Red', value: 'bg-red-500', light: 'bg-red-100' },
  { name: 'Indigo', value: 'bg-indigo-500', light: 'bg-indigo-100' }
]

export const ImageCollections = ({ currentImage }: ImageCollectionsProps) => {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAddToCollectionOpen, setIsAddToCollectionOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500'
  })

  // Load collections from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('image-collections')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCollections(parsed)
      } catch (error) {
        console.error('Failed to parse collections:', error)
        // Create default favorites collection
        createDefaultCollection()
      }
    } else {
      createDefaultCollection()
    }
  }, [])

  // Save collections to localStorage
  const saveCollections = (newCollections: Collection[]) => {
    setCollections(newCollections)
    localStorage.setItem('image-collections', JSON.stringify(newCollections))
  }

  const createDefaultCollection = () => {
    const defaultCollection: Collection = {
      id: 'favorites',
      name: 'Favoritos',
      description: 'Suas imagens favoritas',
      color: 'bg-red-500',
      images: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: true
    }
    saveCollections([defaultCollection])
  }

  const createCollection = () => {
    if (!newCollection.name.trim()) {
      toast.error('Nome da coleção é obrigatório')
      return
    }

    const collection: Collection = {
      id: Date.now().toString(),
      name: newCollection.name.trim(),
      description: newCollection.description.trim() || undefined,
      color: newCollection.color,
      images: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const newCollections = [...collections, collection]
    saveCollections(newCollections)
    
    analytics.user.featureUsed('collection_created', {
      name: collection.name,
      total_collections: newCollections.length
    })

    setNewCollection({ name: '', description: '', color: 'bg-blue-500' })
    setIsCreateDialogOpen(false)
    toast.success(`Coleção "${collection.name}" criada!`)
  }

  const addImageToCollection = (collectionId: string) => {
    if (!currentImage) return

    const imageToAdd: SavedImage = {
      id: Date.now().toString(),
      url: currentImage.url,
      prompt: currentImage.prompt,
      provider: currentImage.provider,
      metadata: currentImage.metadata,
      addedAt: Date.now(),
      isFavorite: collectionId === 'favorites'
    }

    const newCollections = collections.map(collection => {
      if (collection.id === collectionId) {
        // Check if image already exists in collection
        const exists = collection.images.some(img => 
          img.url === imageToAdd.url && img.prompt === imageToAdd.prompt
        )
        
        if (exists) {
          toast.error('Imagem já existe nesta coleção')
          return collection
        }

        const updatedCollection = {
          ...collection,
          images: [...collection.images, imageToAdd],
          updatedAt: Date.now()
        }
        
        toast.success(`Imagem adicionada à "${collection.name}"`)
        
        analytics.user.imageFavorited(currentImage.provider)
        analytics.user.featureUsed('image_added_to_collection', {
          collection_id: collectionId,
          collection_name: collection.name,
          provider: currentImage.provider
        })
        
        return updatedCollection
      }
      return collection
    })

    saveCollections(newCollections)
    setIsAddToCollectionOpen(false)
  }

  const removeImageFromCollection = (collectionId: string, imageId: string) => {
    const newCollections = collections.map(collection => {
      if (collection.id === collectionId) {
        return {
          ...collection,
          images: collection.images.filter(img => img.id !== imageId),
          updatedAt: Date.now()
        }
      }
      return collection
    })

    saveCollections(newCollections)
    toast.success('Imagem removida da coleção')
  }

  const deleteCollection = (collectionId: string) => {
    if (collections.find(c => c.id === collectionId)?.isDefault) {
      toast.error('Não é possível deletar a coleção padrão')
      return
    }

    const newCollections = collections.filter(c => c.id !== collectionId)
    saveCollections(newCollections)
    toast.success('Coleção deletada')
  }

  const downloadImage = async (image: SavedImage) => {
    try {
      if (image.url.startsWith('data:')) {
        const a = document.createElement('a')
        a.href = image.url
        a.download = `collection-image-${image.id}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        const response = await fetch(image.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `collection-image-${image.id}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

      analytics.user.imageDownloaded('collection')
      toast.success('Download iniciado!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Erro ao fazer download')
    }
  }

  const totalImages = collections.reduce((sum, collection) => sum + collection.images.length, 0)
  const favoritesCollection = collections.find(c => c.id === 'favorites')

  return (
    <div className="space-y-6">
      {/* Quick Add to Favorites */}
      {currentImage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Heart className="w-4 h-4 mr-2" />
              Salvar Imagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => addImageToCollection('favorites')}
                className="flex-1"
              >
                <Heart className="w-3 h-3 mr-1" />
                Adicionar aos Favoritos
              </Button>
              
              <Dialog open={isAddToCollectionOpen} onOpenChange={setIsAddToCollectionOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-3 h-3 mr-1" />
                    Coleção
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar à Coleção</DialogTitle>
                    <DialogDescription>
                      Escolha uma coleção para salvar esta imagem
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {collections.map(collection => (
                      <div 
                        key={collection.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => addImageToCollection(collection.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${collection.color}`} />
                          <div>
                            <p className="font-medium">{collection.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {collection.images.length} imagens
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {collection.images.length}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collections Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Minhas Coleções
              </CardTitle>
              <CardDescription>
                {collections.length} coleções • {totalImages} imagens salvas
              </CardDescription>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Coleção
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Coleção</DialogTitle>
                  <DialogDescription>
                    Organize suas imagens criando coleções temáticas
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome da Coleção</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Natureza, Retratos, Abstratos..."
                      value={newCollection.name}
                      onChange={(e) => setNewCollection({...newCollection, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva o tema ou propósito desta coleção..."
                      value={newCollection.description}
                      onChange={(e) => setNewCollection({...newCollection, description: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label>Cor da Coleção</Label>
                    <div className="flex gap-2 mt-2">
                      {defaultColors.map(color => (
                        <button
                          key={color.value}
                          className={`w-8 h-8 rounded-full ${color.value} ${
                            newCollection.color === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                          }`}
                          onClick={() => setNewCollection({...newCollection, color: color.value})}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={createCollection} className="flex-1">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Coleção
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {collections.map(collection => (
                <div key={collection.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${collection.color}`} />
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {collection.name}
                          {collection.isDefault && <Star className="w-3 h-3 text-yellow-500" />}
                        </h4>
                        {collection.description && (
                          <p className="text-xs text-muted-foreground">{collection.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {collection.images.length} imagens
                      </Badge>
                      
                      {!collection.isDefault && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => deleteCollection(collection.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Deletar Coleção
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  
                  {collection.images.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {collection.images.slice(0, 4).map(image => (
                        <div key={image.id} className="relative aspect-square group">
                          <Image
                            src={image.url}
                            alt={image.prompt.slice(0, 50)}
                            fill
                            className="object-cover rounded-md"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-md flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => downloadImage(image)}
                            >
                              <ImageIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {collection.images.length > 4 && (
                        <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                          <span className="text-xs font-medium text-muted-foreground">
                            +{collection.images.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma imagem nesta coleção</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export default ImageCollections
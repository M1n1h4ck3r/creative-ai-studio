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
  Plus,
  Trash2,
  MoreVertical,
  Star,
  BookOpen,
  Image as ImageIcon,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import { analytics } from '@/lib/analytics'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Collection {
  id: string
  name: string
  description?: string
  color: string
  is_default?: boolean
  items?: CollectionItem[]
  item_count?: number
}

interface CollectionItem {
  id: string
  image_url: string
  prompt: string
  provider: string
  aspect_ratio?: string
  metadata?: any
  added_at: string
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
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Indigo', value: 'bg-indigo-500' }
]

export const ImageCollections = ({ currentImage }: ImageCollectionsProps) => {
  const { user } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAddToCollectionOpen, setIsAddToCollectionOpen] = useState(false)
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500'
  })
  const supabase = createClient()

  const fetchCollections = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data: collectionsData, error } = await supabase
        .from('collections')
        .select(`
          *,
          items:collection_items(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedCollections = collectionsData.map((c: any) => ({
        ...c,
        item_count: c.items?.length || 0,
        items: c.items || []
      }))

      setCollections(formattedCollections)
    } catch (error) {
      console.error('Error fetching collections:', error)
      toast.error('Erro ao carregar coleções')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [user])

  const createCollection = async () => {
    if (!newCollection.name.trim()) {
      toast.error('Nome da coleção é obrigatório')
      return
    }

    if (!user) return

    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: user.id,
          name: newCollection.name.trim(),
          description: newCollection.description.trim() || null,
          color: newCollection.color
        })
        .select()
        .single()

      if (error) throw error

      setCollections(prev => [{ ...data, items: [], item_count: 0 }, ...prev])

      analytics.user.featureUsed('collection_created', {
        name: data.name
      })

      setNewCollection({ name: '', description: '', color: 'bg-blue-500' })
      setIsCreateDialogOpen(false)
      toast.success(`Coleção "${data.name}" criada!`)
    } catch (error) {
      console.error('Error creating collection:', error)
      toast.error('Erro ao criar coleção')
    }
  }

  const addImageToCollection = async (collectionId: string) => {
    if (!currentImage || !user) return

    try {
      // Check if image already exists in collection (client-side check for immediate feedback)
      const collection = collections.find(c => c.id === collectionId)
      if (collection?.items?.some(item => item.image_url === currentImage.url)) {
        toast.error('Imagem já existe nesta coleção')
        return
      }

      const { error } = await supabase
        .from('collection_items')
        .insert({
          collection_id: collectionId,
          user_id: user.id,
          image_url: currentImage.url,
          prompt: currentImage.prompt,
          provider: currentImage.provider,
          metadata: currentImage.metadata
        })

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.error('Imagem já existe nesta coleção')
        } else {
          throw error
        }
        return
      }

      toast.success('Imagem adicionada à coleção')
      fetchCollections() // Refresh to get updated items
      setIsAddToCollectionOpen(false)

      analytics.user.imageFavorited(currentImage.provider)

    } catch (error) {
      console.error('Error adding image to collection:', error)
      toast.error('Erro ao salvar imagem')
    }
  }

  const deleteCollection = async (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId)
    if (collection?.is_default) {
      toast.error('Não é possível deletar a coleção padrão')
      return
    }

    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId)

      if (error) throw error

      setCollections(prev => prev.filter(c => c.id !== collectionId))
      toast.success('Coleção deletada')
    } catch (error) {
      console.error('Error deleting collection:', error)
      toast.error('Erro ao deletar coleção')
    }
  }

  const downloadImage = async (image: CollectionItem) => {
    try {
      if (image.image_url.startsWith('data:')) {
        const a = document.createElement('a')
        a.href = image.image_url
        a.download = `collection-image-${image.id}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        const response = await fetch(image.image_url)
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

  const totalImages = collections.reduce((sum, c) => sum + (c.item_count || 0), 0)

  if (loading && collections.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
                onClick={() => {
                  const favorites = collections.find(c => c.is_default)
                  if (favorites) addImageToCollection(favorites.id)
                }}
                className="flex-1"
                disabled={loading}
              >
                <Heart className="w-3 h-3 mr-1" />
                Adicionar aos Favoritos
              </Button>

              <Dialog open={isAddToCollectionOpen} onOpenChange={setIsAddToCollectionOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={loading}>
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
                              {collection.item_count} imagens
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {collection.item_count}
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
                      onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva o tema ou propósito desta coleção..."
                      value={newCollection.description}
                      onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Cor da Coleção</Label>
                    <div className="flex gap-2 mt-2">
                      {defaultColors.map(color => (
                        <button
                          key={color.value}
                          className={`w-8 h-8 rounded-full ${color.value} ${newCollection.color === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                            }`}
                          onClick={() => setNewCollection({ ...newCollection, color: color.value })}
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
                          {collection.is_default && <Star className="w-3 h-3 text-yellow-500" />}
                        </h4>
                        {collection.description && (
                          <p className="text-xs text-muted-foreground">{collection.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {collection.item_count} imagens
                      </Badge>

                      {!collection.is_default && (
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

                  {collection.items && collection.items.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {collection.items.slice(0, 4).map(image => (
                        <div key={image.id} className="relative aspect-square group">
                          <Image
                            src={image.image_url}
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
                      {collection.items.length > 4 && (
                        <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                          <span className="text-xs font-medium text-muted-foreground">
                            +{collection.items.length - 4}
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
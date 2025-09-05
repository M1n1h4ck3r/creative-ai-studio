'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Palette, Camera, Sparkles, Heart, Building2, User, Gamepad2 } from 'lucide-react'

interface Template {
  id: string
  title: string
  prompt: string
  category: string
  aspectRatio: string
  tags: string[]
  icon: React.ReactNode
}

const promptTemplates: Template[] = [
  // Marketing & Branding
  {
    id: 'modern-logo',
    title: 'Logo Moderno',
    prompt: 'Logo moderno e minimalista para [MARCA], design limpo, tipografia elegante, cores vibrantes, fundo transparente, estilo profissional',
    category: 'marketing',
    aspectRatio: '1:1',
    tags: ['logo', 'branding', 'moderno'],
    icon: <Building2 className="h-4 w-4" />
  },
  {
    id: 'product-banner',
    title: 'Banner de Produto',
    prompt: 'Banner promocional elegante para [PRODUTO], composição dinâmica, cores chamativas, texto destacado, estilo comercial, alta qualidade',
    category: 'marketing',
    aspectRatio: '16:9',
    tags: ['banner', 'produto', 'promocional'],
    icon: <Palette className="h-4 w-4" />
  },
  {
    id: 'social-post',
    title: 'Post para Redes Sociais',
    prompt: 'Post atrativo para Instagram sobre [TEMA], design colorido e vibrante, elementos gráficos modernos, texto legível, estilo jovem',
    category: 'marketing',
    aspectRatio: '1:1',
    tags: ['social', 'instagram', 'colorido'],
    icon: <Heart className="h-4 w-4" />
  },

  // Arte & Design
  {
    id: 'digital-art',
    title: 'Arte Digital',
    prompt: 'Arte digital surreal de [TEMA], cores néon vibrantes, estilo cyberpunk, elementos futuristas, alta resolução, detalhes intrincados',
    category: 'arte',
    aspectRatio: '4:5',
    tags: ['digital', 'surreal', 'cyberpunk'],
    icon: <Sparkles className="h-4 w-4" />
  },
  {
    id: 'watercolor',
    title: 'Aquarela Artística',
    prompt: 'Pintura em aquarela delicada de [TEMA], tons pastéis suaves, pinceladas fluidas, estilo impressionista, textura natural',
    category: 'arte',
    aspectRatio: '4:5',
    tags: ['aquarela', 'pastel', 'impressionista'],
    icon: <Palette className="h-4 w-4" />
  },
  {
    id: 'minimalist',
    title: 'Design Minimalista',
    prompt: 'Design minimalista limpo de [TEMA], paleta monocromática, espaço negativo, geometria simples, elegância moderna',
    category: 'arte',
    aspectRatio: '1:1',
    tags: ['minimalista', 'limpo', 'moderno'],
    icon: <Building2 className="h-4 w-4" />
  },

  // Fotografia
  {
    id: 'portrait',
    title: 'Retrato Profissional',
    prompt: 'Retrato profissional de [PESSOA], iluminação cinematográfica, fundo desfocado, expressão confiante, alta qualidade, estilo editorial',
    category: 'fotografia',
    aspectRatio: '4:5',
    tags: ['retrato', 'profissional', 'cinematográfico'],
    icon: <User className="h-4 w-4" />
  },
  {
    id: 'landscape',
    title: 'Paisagem Épica',
    prompt: 'Paisagem épica de [LOCAL], hora dourada, céu dramático, composição panorâmica, cores vibrantes, fotografia de natureza',
    category: 'fotografia',
    aspectRatio: '16:9',
    tags: ['paisagem', 'natureza', 'épico'],
    icon: <Camera className="h-4 w-4" />
  },
  {
    id: 'food-photo',
    title: 'Fotografia Gastronômica',
    prompt: 'Fotografia gastronômica profissional de [PRATO], iluminação natural, composição apetitosa, cores vivas, estilo magazine',
    category: 'fotografia',
    aspectRatio: '4:5',
    tags: ['food', 'gastronômica', 'apetitosa'],
    icon: <Heart className="h-4 w-4" />
  },

  // Jogos & Diversão
  {
    id: 'game-character',
    title: 'Personagem de Jogo',
    prompt: 'Personagem de videogame de [TIPO], design concept art, cores vibrantes, armadura detalhada, pose dinâmica, estilo fantasia épica',
    category: 'games',
    aspectRatio: '4:5',
    tags: ['character', 'fantasy', 'épico'],
    icon: <Gamepad2 className="h-4 w-4" />
  },
  {
    id: 'game-scene',
    title: 'Cenário de Jogo',
    prompt: 'Cenário épico para videogame de [AMBIENTE], arquitetura fantástica, iluminação mágica, detalhes ricos, perspectiva cinematográfica',
    category: 'games',
    aspectRatio: '16:9',
    tags: ['cenário', 'fantasia', 'épico'],
    icon: <Building2 className="h-4 w-4" />
  },
]

const categories = [
  { id: 'all', label: 'Todos', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'marketing', label: 'Marketing', icon: <Building2 className="h-4 w-4" /> },
  { id: 'arte', label: 'Arte', icon: <Palette className="h-4 w-4" /> },
  { id: 'fotografia', label: 'Fotografia', icon: <Camera className="h-4 w-4" /> },
  { id: 'games', label: 'Games', icon: <Gamepad2 className="h-4 w-4" /> },
]

interface PromptTemplatesProps {
  onSelectTemplate: (template: Template) => void
  className?: string
}

export default function PromptTemplates({ onSelectTemplate, className }: PromptTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemplates = promptTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5" />
          <span>Templates de Prompt</span>
        </CardTitle>
        <CardDescription>
          Selecione um template para começar ou inspire-se nas sugestões
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-2">
                {category.icon}
                <span>{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            <div className="max-h-[400px] overflow-y-auto">
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                          {template.icon}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{template.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {template.aspectRatio}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.prompt}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {template.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum template encontrado</p>
                    <p className="text-sm">Tente uma busca diferente</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  Filter,
  Star,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Share2,
  Download,
  Eye
} from 'lucide-react'
import { 
  Template,
  TemplateCategory,
  TemplateEngine,
  TEMPLATE_CATEGORIES,
  BUILTIN_TEMPLATES
} from '@/lib/templates'

interface AdvancedTemplatesProps {
  className?: string
  onSelectTemplate?: (template: Template, variables: Record<string, any>) => void
}

export const AdvancedTemplates: React.FC<AdvancedTemplatesProps> = ({ 
  className, 
  onSelectTemplate 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'browse' | 'popular' | 'rated' | 'mine'>('browse')
  const [previewMode, setPreviewMode] = useState(false)

  const filteredTemplates = React.useMemo(() => {
    let templates = BUILTIN_TEMPLATES

    if (selectedCategory !== 'all') {
      templates = TemplateEngine.getTemplatesByCategory(selectedCategory)
    }

    if (searchQuery) {
      templates = TemplateEngine.searchTemplates(searchQuery, selectedCategory !== 'all' ? selectedCategory : undefined)
    }

    return templates
  }, [searchQuery, selectedCategory])

  const popularTemplates = TemplateEngine.getPopularTemplates(6)
  const topRatedTemplates = TemplateEngine.getTopRatedTemplates(6)

  useEffect(() => {
    if (selectedTemplate) {
      // Initialize variables with default values
      const defaultVariables: Record<string, any> = {}
      selectedTemplate.settings.variables?.forEach(variable => {
        defaultVariables[variable.name] = variable.defaultValue || ''
      })
      setTemplateVariables(defaultVariables)
    }
  }, [selectedTemplate])

  const handleVariableChange = (name: string, value: any) => {
    setTemplateVariables(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear validation errors when user types
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  const handleUseTemplate = () => {
    if (!selectedTemplate) return

    const errors = TemplateEngine.validateVariables(selectedTemplate, templateVariables)
    
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    const processedPrompt = TemplateEngine.processTemplate(selectedTemplate, templateVariables)
    
    onSelectTemplate?.(selectedTemplate, {
      ...templateVariables,
      processedPrompt
    })
  }

  const getPreview = () => {
    if (!selectedTemplate) return ''
    return TemplateEngine.processTemplate(selectedTemplate, templateVariables)
  }

  const TemplateCard: React.FC<{ template: Template }> = ({ template }) => (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
            <CardDescription className="text-xs">
              {template.description}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {TEMPLATE_CATEGORIES.find(cat => cat.id === template.category)?.icon}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 mb-2">
          {template.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex justify-between items-center text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {template.rating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {template.usageCount}
          </div>
        </div>
        <Button 
          size="sm" 
          className="w-full mt-2"
          onClick={() => setSelectedTemplate(template)}
        >
          <Eye className="w-3 h-3 mr-1" />
          Visualizar
        </Button>
      </CardContent>
    </Card>
  )

  const renderVariableInput = (variable: any) => {
    const value = templateVariables[variable.name] || ''
    
    switch (variable.type) {
      case 'text':
        return (
          <div key={variable.name} className="space-y-2">
            <Label htmlFor={variable.name}>
              {variable.label}
              {variable.required && <span className="text-red-500">*</span>}
            </Label>
            {variable.name === 'prompt' || variable.name === 'description' ? (
              <Textarea
                id={variable.name}
                placeholder={variable.description}
                value={value}
                onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                className="min-h-[100px]"
              />
            ) : (
              <Input
                id={variable.name}
                placeholder={variable.description}
                value={value}
                onChange={(e) => handleVariableChange(variable.name, e.target.value)}
              />
            )}
            {variable.description && (
              <p className="text-xs text-gray-600">{variable.description}</p>
            )}
          </div>
        )
        
      case 'number':
        return (
          <div key={variable.name} className="space-y-2">
            <Label htmlFor={variable.name}>
              {variable.label}
              {variable.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={variable.name}
              type="number"
              min={variable.min}
              max={variable.max}
              value={value}
              onChange={(e) => handleVariableChange(variable.name, Number(e.target.value))}
            />
          </div>
        )
        
      case 'select':
        return (
          <div key={variable.name} className="space-y-2">
            <Label htmlFor={variable.name}>
              {variable.label}
              {variable.required && <span className="text-red-500">*</span>}
            </Label>
            <Select 
              value={value} 
              onValueChange={(val) => handleVariableChange(variable.name, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Selecione ${variable.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {variable.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
        
      case 'boolean':
        return (
          <div key={variable.name} className="flex items-center space-x-2">
            <input
              id={variable.name}
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleVariableChange(variable.name, e.target.checked)}
              className="rounded"
            />
            <Label htmlFor={variable.name}>{variable.label}</Label>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Templates Avançados</h2>
          <p className="text-gray-600">
            Acelere sua criatividade com templates profissionais
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Criar Template
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select 
          value={selectedCategory} 
          onValueChange={(value) => setSelectedCategory(value as TemplateCategory | 'all')}
        >
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {TEMPLATE_CATEGORIES.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.icon} {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="browse">Navegar</TabsTrigger>
          <TabsTrigger value="popular">Populares</TabsTrigger>
          <TabsTrigger value="rated">Mais Avaliados</TabsTrigger>
          <TabsTrigger value="mine">Meus Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">Nenhum template encontrado</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="popular" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularTemplates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rated" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topRatedTemplates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Você ainda não criou nenhum template</p>
            <Button className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeiro Template
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate?.name}
              <Badge>{selectedTemplate?.type}</Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Variables Form */}
              <div className="space-y-4">
                <h3 className="font-semibold">Personalize o Template</h3>
                
                {selectedTemplate.settings.variables?.map(renderVariableInput)}
                
                {validationErrors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <ul className="text-sm text-red-600 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleUseTemplate} className="flex-1">
                    Usar Template
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <h3 className="font-semibold">Preview</h3>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Prompt Gerado:</h4>
                  <div className="text-sm bg-white p-3 rounded border">
                    {getPreview() || 'Configure as variáveis para ver o preview...'}
                  </div>
                </div>

                {selectedTemplate.negativePrompt && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Prompt Negativo:</h4>
                    <div className="text-sm bg-white p-3 rounded border">
                      {selectedTemplate.negativePrompt}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Categoria:</strong> {TEMPLATE_CATEGORIES.find(cat => cat.id === selectedTemplate.category)?.name}</p>
                  <p><strong>Autor:</strong> {selectedTemplate.author}</p>
                  <p><strong>Avaliação:</strong> {selectedTemplate.rating.toFixed(1)} ⭐</p>
                  <p><strong>Usos:</strong> {selectedTemplate.usageCount}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdvancedTemplates
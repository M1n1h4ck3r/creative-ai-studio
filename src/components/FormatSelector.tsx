'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FORMAT_PRESETS, 
  getPopularFormats,
  getFormatsByCategory,
  FormatInfo, 
  FormatCategory,
  FormatSelection 
} from '@/types/formats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Grid, 
  Smartphone, 
  Monitor, 
  Printer, 
  Globe, 
  Zap, 
  Info,
  Check,
  X
} from 'lucide-react'

interface FormatSelectorProps {
  onFormatSelect: (selection: FormatSelection) => void
  selectedFormats: string[]
  allowMultiple?: boolean
  showBatchGeneration?: boolean
  className?: string
}

export default function FormatSelector({
  onFormatSelect,
  selectedFormats = [],
  allowMultiple = false,
  showBatchGeneration = false,
  className = ''
}: FormatSelectorProps) {
  const [activeTab, setActiveTab] = useState<'popular' | FormatCategory>('popular')
  const [batchMode, setBatchMode] = useState(false)
  
  // Memoize the formats to avoid recalculation on each render
  const popularFormats = React.useMemo(() => getPopularFormats(), [])
  const formatsByCategory = React.useMemo(() => {
    return {
      [FormatCategory.SOCIAL_MEDIA]: getFormatsByCategory(FormatCategory.SOCIAL_MEDIA),
      [FormatCategory.PRINT]: getFormatsByCategory(FormatCategory.PRINT),
      [FormatCategory.WEB]: getFormatsByCategory(FormatCategory.WEB),
      [FormatCategory.MOBILE]: getFormatsByCategory(FormatCategory.MOBILE),
    }
  }, [])

  const handleFormatToggle = (formatId: string) => {
    let newSelection: string[]
    
    if (allowMultiple) {
      newSelection = selectedFormats.includes(formatId)
        ? selectedFormats.filter(id => id !== formatId)
        : [...selectedFormats, formatId]
    } else {
      newSelection = selectedFormats.includes(formatId) ? [] : [formatId]
    }

    onFormatSelect({
      selectedFormats: newSelection,
      batchGeneration: batchMode && newSelection.length > 1
    })
  }

  const FormatCard = ({ format, isSelected }: { format: FormatInfo; isSelected: boolean }) => (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`cursor-pointer ${className}`}
    >
      <Card 
        className={`transition-all duration-200 ${
          isSelected 
            ? 'ring-2 ring-primary bg-primary/5 shadow-md' 
            : 'hover:shadow-md hover:bg-accent/50'
        }`}
        onClick={() => handleFormatToggle(format.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{format.icon}</span>
              <div>
                <CardTitle className="text-sm font-medium">{format.name}</CardTitle>
                <CardDescription className="text-xs">
                  {format.aspectRatio} • {format.dimensions.width}×{format.dimensions.height}
                </CardDescription>
              </div>
            </div>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-primary text-primary-foreground rounded-full p-1"
              >
                <Check size={12} />
              </motion.div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Aspect Ratio Preview */}
          <div className="flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 mb-3">
            <motion.div
              className="bg-white dark:bg-gray-700 rounded border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center text-xs text-gray-500"
              style={{
                width: `${Math.max(40, Math.min(80, (format.dimensions.width / format.dimensions.height) * 40))}px`,
                height: `${Math.max(30, Math.min(60, (format.dimensions.height / format.dimensions.width) * 40))}px`,
              }}
            >
              {format.aspectRatio}
            </motion.div>
          </div>

          {/* Category Badge */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              {format.category.replace('-', ' ')}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format.dimensions.megapixels}MP
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {format.description}
          </p>

          {/* Platforms */}
          {format.platforms && format.platforms.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {format.platforms.slice(0, 2).map((platform) => (
                <Badge key={platform} variant="outline" className="text-xs px-2 py-0">
                  {platform}
                </Badge>
              ))}
              {format.platforms.length > 2 && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      +{format.platforms.length - 2}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      {format.platforms.slice(2).join(', ')}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {/* Use Cases */}
          <div className="text-xs text-muted-foreground">
            <strong>Ideal para:</strong> {format.useCases.slice(0, 2).join(', ')}
            {format.useCases.length > 2 && '...'}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const getCategoryIcon = (category: FormatCategory) => {
    switch (category) {
      case FormatCategory.SOCIAL_MEDIA:
        return <Smartphone size={16} />
      case FormatCategory.PRINT:
        return <Printer size={16} />
      case FormatCategory.WEB:
        return <Globe size={16} />
      case FormatCategory.MOBILE:
        return <Monitor size={16} />
      default:
        return <Grid size={16} />
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Escolha o Formato</h3>
          <p className="text-sm text-muted-foreground">
            {allowMultiple 
              ? 'Selecione um ou mais formatos para sua imagem'
              : 'Selecione o formato ideal para sua imagem'
            }
          </p>
        </div>
        
        {/* Batch Generation Toggle */}
        {showBatchGeneration && allowMultiple && selectedFormats.length > 1 && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="batch-mode"
              checked={batchMode}
              onCheckedChange={setBatchMode}
            />
            <label htmlFor="batch-mode" className="text-sm font-medium">
              Gerar em lote
            </label>
            <Tooltip>
              <TooltipTrigger>
                <Info size={14} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm max-w-xs">
                  Gere a mesma imagem em todos os formatos selecionados simultaneamente
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Selection Summary */}
      <AnimatePresence>
        {selectedFormats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Zap size={16} className="text-primary" />
                <span className="font-medium">
                  {selectedFormats.length} formato{selectedFormats.length > 1 ? 's' : ''} selecionado{selectedFormats.length > 1 ? 's' : ''}
                </span>
                {batchMode && selectedFormats.length > 1 && (
                  <Badge variant="default" className="text-xs">
                    Modo Lote
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFormatSelect({ selectedFormats: [], batchGeneration: false })}
                className="text-xs h-8"
              >
                <X size={14} className="mr-1" />
                Limpar
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedFormats.map((formatId) => {
                const format = FORMAT_PRESETS[formatId]
                if (!format) return null
                return (
                  <Badge key={formatId} variant="secondary" className="text-xs">
                    {format.icon} {format.name} ({format.aspectRatio})
                  </Badge>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Format Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="popular" className="flex items-center gap-1">
            <Zap size={14} />
            <span className="hidden sm:inline">Popular</span>
          </TabsTrigger>
          <TabsTrigger value={FormatCategory.SOCIAL_MEDIA} className="flex items-center gap-1">
            {getCategoryIcon(FormatCategory.SOCIAL_MEDIA)}
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value={FormatCategory.WEB} className="flex items-center gap-1">
            {getCategoryIcon(FormatCategory.WEB)}
            <span className="hidden sm:inline">Web</span>
          </TabsTrigger>
          <TabsTrigger value={FormatCategory.PRINT} className="flex items-center gap-1">
            {getCategoryIcon(FormatCategory.PRINT)}
            <span className="hidden sm:inline">Print</span>
          </TabsTrigger>
          <TabsTrigger value={FormatCategory.MOBILE} className="flex items-center gap-1">
            {getCategoryIcon(FormatCategory.MOBILE)}
            <span className="hidden sm:inline">Mobile</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="popular" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {popularFormats.map((format) => (
              <FormatCard
                key={format.id}
                format={format}
                isSelected={selectedFormats.includes(format.id)}
              />
            ))}
          </div>
        </TabsContent>

        {Object.values(FormatCategory).map((category) => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {formatsByCategory[category]?.map((format) => (
                <FormatCard
                  key={format.id}
                  format={format}
                  isSelected={selectedFormats.includes(format.id)}
                />
              )) || (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Monitor size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhum formato disponível nesta categoria</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
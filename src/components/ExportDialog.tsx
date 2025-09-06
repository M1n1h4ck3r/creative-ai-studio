'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Settings, 
  Image, 
  FileText, 
  Package, 
  Sparkles,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { 
  ExportManager,
  ExportOptions,
  ExportableItem,
  ExportResult,
  EXPORT_FORMATS,
  exportManager
} from '@/lib/export'

interface ExportDialogProps {
  items: ExportableItem[]
  trigger?: React.ReactNode
  onExportComplete?: (result: ExportResult) => void
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  items,
  trigger,
  onExportComplete
}) => {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 'high',
    includeMetadata: true,
    includePrompts: true,
    compression: {
      enabled: true,
      level: 6
    }
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)
    
    try {
      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const result = await exportManager.exportItems(items, options)
      
      clearInterval(progressInterval)
      setExportProgress(100)
      
      setExportResult(result)
      
      if (result.success && result.blob && result.filename) {
        exportManager.downloadResult(result)
        onExportComplete?.(result)
      }
    } catch (error) {
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      })
    } finally {
      setIsExporting(false)
      setTimeout(() => {
        setExportProgress(0)
        setExportResult(null)
      }, 3000)
    }
  }

  const updateOptions = (key: keyof ExportOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const getFormatCategory = (format: string) => {
    for (const [category, formats] of Object.entries(EXPORT_FORMATS)) {
      if (formats.some(f => f.value === format)) {
        return category
      }
    }
    return 'image'
  }

  const getFormatInfo = (format: string) => {
    for (const formats of Object.values(EXPORT_FORMATS)) {
      const formatInfo = formats.find(f => f.value === format)
      if (formatInfo) return formatInfo
    }
    return null
  }

  const estimatedSize = React.useMemo(() => {
    // Simple estimation based on format and quality
    const baseSize = items.length * 2 // MB per item
    const qualityMultiplier = {
      'low': 0.3,
      'medium': 0.6,
      'high': 1.0,
      'original': 1.5
    }[options.quality || 'high']
    
    const formatMultiplier = {
      'png': 1.2,
      'jpg': 0.8,
      'webp': 0.6,
      'pdf': 1.5,
      'zip': 0.9,
      'svg': 0.3
    }[options.format] || 1

    return Math.round(baseSize * qualityMultiplier * formatMultiplier * 10) / 10
  }, [items.length, options.format, options.quality])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Exportar ({items.length})
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Conteúdo
            <Badge variant="secondary">{items.length} items</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Formato de Exportação</Label>
            
            <Tabs value={getFormatCategory(options.format)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="image" className="gap-1">
                  <Image className="w-3 h-3" />
                  Imagem
                </TabsTrigger>
                <TabsTrigger value="document" className="gap-1">
                  <FileText className="w-3 h-3" />
                  Documento
                </TabsTrigger>
                <TabsTrigger value="data" className="gap-1">
                  <Package className="w-3 h-3" />
                  Dados
                </TabsTrigger>
                <TabsTrigger value="professional" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  Pro
                </TabsTrigger>
              </TabsList>

              {Object.entries(EXPORT_FORMATS).map(([category, formats]) => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-2 gap-2">
                    {formats.map((format) => (
                      <Button
                        key={format.value}
                        variant={options.format === format.value ? "default" : "outline"}
                        className="h-auto p-3 flex flex-col items-start"
                        onClick={() => updateOptions('format', format.value)}
                        disabled={format.value === 'psd' || format.value === 'ai' || format.value === 'sketch'}
                      >
                        <div className="font-medium">{format.label}</div>
                        <div className="text-xs opacity-70">{format.description}</div>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Format Info */}
            {getFormatInfo(options.format) && (
              <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900">
                    {getFormatInfo(options.format)?.label}
                  </div>
                  <div className="text-blue-700">
                    {getFormatInfo(options.format)?.description}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quality Settings */}
          {['png', 'jpg', 'webp', 'pdf'].includes(options.format) && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Qualidade</Label>
              <Select 
                value={options.quality} 
                onValueChange={(value) => updateOptions('quality', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa (Arquivo menor)</SelectItem>
                  <SelectItem value="medium">Média (Balanceada)</SelectItem>
                  <SelectItem value="high">Alta (Recomendada)</SelectItem>
                  <SelectItem value="original">Original (Maior tamanho)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dimensions */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Dimensões (opcional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Largura</Label>
                <Input
                  type="number"
                  placeholder="Auto"
                  value={options.dimensions?.width || ''}
                  onChange={(e) => updateOptions('dimensions', {
                    ...options.dimensions,
                    width: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>
              <div>
                <Label className="text-sm">Altura</Label>
                <Input
                  type="number"
                  placeholder="Auto"
                  value={options.dimensions?.height || ''}
                  onChange={(e) => updateOptions('dimensions', {
                    ...options.dimensions,
                    height: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Opções Adicionais</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={options.includeMetadata}
                  onCheckedChange={(checked) => updateOptions('includeMetadata', checked)}
                />
                <Label htmlFor="metadata" className="text-sm">
                  Incluir metadados (data, configurações, etc.)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="prompts"
                  checked={options.includePrompts}
                  onCheckedChange={(checked) => updateOptions('includePrompts', checked)}
                />
                <Label htmlFor="prompts" className="text-sm">
                  Incluir prompts utilizados
                </Label>
              </div>
            </div>
          </div>

          {/* Compression */}
          {options.format === 'zip' && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Compressão</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Nível: {options.compression?.level}</Label>
                  <Badge variant="outline">
                    {options.compression?.level === 0 ? 'Sem compressão' :
                     options.compression?.level! < 3 ? 'Baixa' :
                     options.compression?.level! < 7 ? 'Média' : 'Alta'}
                  </Badge>
                </div>
                <Slider
                  value={[options.compression?.level || 6]}
                  onValueChange={([value]) => updateOptions('compression', {
                    ...options.compression,
                    level: value
                  })}
                  max={9}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Watermark */}
          <details className="space-y-3">
            <summary className="text-base font-medium cursor-pointer">
              Marca d'água (opcional)
            </summary>
            <div className="space-y-3 pl-4">
              <div>
                <Label className="text-sm">Texto</Label>
                <Input
                  placeholder="Creative AI Studio"
                  value={options.watermark?.text || ''}
                  onChange={(e) => updateOptions('watermark', {
                    ...options.watermark,
                    text: e.target.value,
                    position: 'bottom-right',
                    opacity: 0.5
                  })}
                />
              </div>
              
              {options.watermark?.text && (
                <>
                  <div>
                    <Label className="text-sm">Posição</Label>
                    <Select 
                      value={options.watermark?.position} 
                      onValueChange={(value) => updateOptions('watermark', {
                        ...options.watermark,
                        position: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Superior Esquerda</SelectItem>
                        <SelectItem value="top-right">Superior Direita</SelectItem>
                        <SelectItem value="bottom-left">Inferior Esquerda</SelectItem>
                        <SelectItem value="bottom-right">Inferior Direita</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Opacidade: {Math.round((options.watermark?.opacity || 0.5) * 100)}%</Label>
                    <Slider
                      value={[options.watermark?.opacity || 0.5]}
                      onValueChange={([value]) => updateOptions('watermark', {
                        ...options.watermark,
                        opacity: value
                      })}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </details>

          {/* Export Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span>Tamanho estimado:</span>
              <Badge variant="secondary">{estimatedSize} MB</Badge>
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exportando...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} />
            </div>
          )}

          {/* Export Result */}
          {exportResult && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              exportResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {exportResult.success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Exportação concluída com sucesso!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Erro: {exportResult.error}</span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={isExporting || items.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exportando...' : `Exportar ${options.format.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExportDialog
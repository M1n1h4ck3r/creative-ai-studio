'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Settings, ChevronDown, ChevronUp, Info, Upload, X, FileImage, File } from 'lucide-react'
import { toast } from 'sonner'

interface GeminiConfig {
  temperature: number
  topP: number
  topK: number
  maxOutputTokens: number
  candidateCount: number
  presencePenalty: number
  frequencyPenalty: number
  stopSequences: string[]
  seed?: number
  responseMimeType: string
}

interface AttachedFile {
  id: string
  name: string
  type: string
  size: number
  data: string
  preview?: string
}

interface GeminiAdvancedControlsProps {
  config: GeminiConfig
  onConfigChange: (config: GeminiConfig) => void
  attachedFiles: AttachedFile[]
  onFilesChange: (files: AttachedFile[]) => void
  className?: string
}

const defaultConfig: GeminiConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 20,
  maxOutputTokens: 1000,
  candidateCount: 1,
  presencePenalty: 0,
  frequencyPenalty: 0,
  stopSequences: [],
  responseMimeType: 'text/plain'
}

export default function GeminiAdvancedControls({ 
  config, 
  onConfigChange, 
  attachedFiles, 
  onFilesChange, 
  className 
}: GeminiAdvancedControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [useSeed, setUseSeed] = useState(!!config.seed)
  const [stopSequenceInput, setStopSequenceInput] = useState('')

  const handleConfigChange = (key: keyof GeminiConfig, value: any) => {
    onConfigChange({
      ...config,
      [key]: value
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newFiles: AttachedFile[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file type (images only for now)
      if (!file.type.startsWith('image/')) {
        toast.error(`Arquivo ${file.name} não é uma imagem válida`)
        continue
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} é muito grande (max 10MB)`)
        continue
      }

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            resolve(result.split(',')[1]) // Remove data:image/jpeg;base64, prefix
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const preview = URL.createObjectURL(file)
        
        newFiles.push({
          id: Date.now().toString() + Math.random().toString(36),
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64Data,
          preview
        })
      } catch (error) {
        toast.error(`Erro ao processar arquivo ${file.name}`)
      }
    }

    if (newFiles.length > 0) {
      onFilesChange([...attachedFiles, ...newFiles])
      toast.success(`${newFiles.length} arquivo(s) anexado(s)`)
    }

    // Reset input
    event.target.value = ''
  }

  const removeFile = (fileId: string) => {
    const fileToRemove = attachedFiles.find(f => f.id === fileId)
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }
    onFilesChange(attachedFiles.filter(f => f.id !== fileId))
  }

  const addStopSequence = () => {
    if (!stopSequenceInput.trim()) return
    const newSequences = [...config.stopSequences, stopSequenceInput.trim()]
    handleConfigChange('stopSequences', newSequences)
    setStopSequenceInput('')
  }

  const removeStopSequence = (index: number) => {
    const newSequences = config.stopSequences.filter((_, i) => i !== index)
    handleConfigChange('stopSequences', newSequences)
  }

  const resetToDefaults = () => {
    onConfigChange(defaultConfig)
    setUseSeed(false)
    toast.success('Configurações resetadas para os valores padrão')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Controles Avançados do Gemini</CardTitle>
                {attachedFiles.length > 0 && (
                  <Badge variant="secondary">{attachedFiles.length} arquivo(s)</Badge>
                )}
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            <CardDescription>
              Configure parâmetros de geração e anexe arquivos de referência
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Anexar Arquivos</h3>
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
              </div>
              
              {attachedFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {attachedFiles.map((file) => (
                    <div key={file.id} className="relative group">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                        {file.preview ? (
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileImage className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="mt-1 text-xs text-center">
                        <p className="truncate" title={file.name}>{file.name}</p>
                        <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generation Parameters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Parâmetros de Geração</h3>
                <Button variant="ghost" size="sm" onClick={resetToDefaults}>
                  Resetar
                </Button>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center space-x-2">
                    <span>Temperature</span>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <span className="text-sm text-muted-foreground">{config.temperature}</span>
                </div>
                <Slider
                  value={[config.temperature]}
                  onValueChange={([value]) => handleConfigChange('temperature', value)}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Controla a criatividade. Valores baixos (&lt; 0.5) para respostas focadas, altos (&gt;= 0.5) para criatividade.
                </p>
              </div>

              {/* Top-P */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center space-x-2">
                    <span>Top-P (Nucleus Sampling)</span>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <span className="text-sm text-muted-foreground">{config.topP}</span>
                </div>
                <Slider
                  value={[config.topP]}
                  onValueChange={([value]) => handleConfigChange('topP', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Seleciona tokens até que a soma das probabilidades atinja este valor.
                </p>
              </div>

              {/* Top-K */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center space-x-2">
                    <span>Top-K</span>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <span className="text-sm text-muted-foreground">{config.topK}</span>
                </div>
                <Slider
                  value={[config.topK]}
                  onValueChange={([value]) => handleConfigChange('topK', value)}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Considera apenas os K tokens mais prováveis para cada posição.
                </p>
              </div>

              {/* Max Output Tokens */}
              <div className="space-y-2">
                <Label>Max Output Tokens</Label>
                <Input
                  type="number"
                  value={config.maxOutputTokens}
                  onChange={(e) => handleConfigChange('maxOutputTokens', parseInt(e.target.value) || 1000)}
                  min={1}
                  max={8192}
                />
                <p className="text-xs text-muted-foreground">
                  Número máximo de tokens na resposta (1-8192).
                </p>
              </div>

              {/* Penalties */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Presence Penalty</Label>
                  <Slider
                    value={[config.presencePenalty]}
                    onValueChange={([value]) => handleConfigChange('presencePenalty', value)}
                    min={-2}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <span className="text-xs text-muted-foreground">{config.presencePenalty}</span>
                </div>
                <div className="space-y-2">
                  <Label>Frequency Penalty</Label>
                  <Slider
                    value={[config.frequencyPenalty]}
                    onValueChange={([value]) => handleConfigChange('frequencyPenalty', value)}
                    min={-2}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <span className="text-xs text-muted-foreground">{config.frequencyPenalty}</span>
                </div>
              </div>

              {/* Seed */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={useSeed}
                    onCheckedChange={(checked) => {
                      setUseSeed(checked)
                      if (!checked) {
                        const { seed, ...configWithoutSeed } = config
                        onConfigChange(configWithoutSeed)
                      } else {
                        handleConfigChange('seed', Math.floor(Math.random() * 1000000))
                      }
                    }}
                  />
                  <Label>Usar Seed (Determinística)</Label>
                </div>
                {useSeed && (
                  <Input
                    type="number"
                    value={config.seed || ''}
                    onChange={(e) => handleConfigChange('seed', parseInt(e.target.value) || undefined)}
                    placeholder="Seed para reproduzibilidade"
                  />
                )}
              </div>

              {/* Stop Sequences */}
              <div className="space-y-2">
                <Label>Stop Sequences</Label>
                <div className="flex space-x-2">
                  <Input
                    value={stopSequenceInput}
                    onChange={(e) => setStopSequenceInput(e.target.value)}
                    placeholder="Ex: STOP!, ###, FIM"
                    onKeyDown={(e) => e.key === 'Enter' && addStopSequence()}
                  />
                  <Button variant="outline" size="sm" onClick={addStopSequence}>
                    Adicionar
                  </Button>
                </div>
                {config.stopSequences.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {config.stopSequences.map((sequence, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeStopSequence(index)}>
                        {sequence} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Candidate Count */}
              <div className="space-y-2">
                <Label>Candidate Count</Label>
                <Slider
                  value={[config.candidateCount]}
                  onValueChange={([value]) => handleConfigChange('candidateCount', value)}
                  min={1}
                  max={4}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>{config.candidateCount}</span>
                  <span>4</span>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
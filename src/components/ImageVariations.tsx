'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { 
  Shuffle, 
  Wand2, 
  Copy, 
  Download, 
  RefreshCw,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Grid3x3,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import { analytics } from '@/lib/analytics'

interface VariationOptions {
  intensity: number // 0-100, how much to vary from original
  count: number // 1-6, how many variations to generate
  style?: string
  mood?: string
  colorScheme?: string
  composition?: string
  promptModifier?: string
}

interface GeneratedVariation {
  id: string
  imageUrl: string
  prompt: string
  intensity: number
  metadata?: any
  createdAt: number
}

interface ImageVariationsProps {
  originalImage: {
    url: string
    prompt: string
    provider: string
    metadata?: any
  }
}

const variationStyles = [
  { value: 'none', label: 'Original Style' },
  { value: 'artistic', label: 'Artistic Interpretation' },
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'cartoon', label: 'Cartoon Style' },
  { value: 'painting', label: 'Digital Painting' },
  { value: 'sketch', label: 'Sketch Style' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'oil-painting', label: 'Oil Painting' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'cyberpunk', label: 'Cyberpunk' }
]

const moodOptions = [
  { value: 'same', label: 'Same Mood' },
  { value: 'bright', label: 'Bright & Cheerful' },
  { value: 'dark', label: 'Dark & Mysterious' },
  { value: 'warm', label: 'Warm & Cozy' },
  { value: 'cool', label: 'Cool & Calm' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'serene', label: 'Serene' },
  { value: 'dramatic', label: 'Dramatic' }
]

const colorSchemes = [
  { value: 'original', label: 'Original Colors' },
  { value: 'monochrome', label: 'Monochrome' },
  { value: 'warm-tones', label: 'Warm Tones' },
  { value: 'cool-tones', label: 'Cool Tones' },
  { value: 'vibrant', label: 'Vibrant Colors' },
  { value: 'pastel', label: 'Pastel Colors' },
  { value: 'neon', label: 'Neon Colors' },
  { value: 'earth-tones', label: 'Earth Tones' }
]

const compositionOptions = [
  { value: 'same', label: 'Same Composition' },
  { value: 'close-up', label: 'Close-up View' },
  { value: 'wide-shot', label: 'Wide Shot' },
  { value: 'different-angle', label: 'Different Angle' },
  { value: 'portrait', label: 'Portrait Orientation' },
  { value: 'landscape', label: 'Landscape Orientation' },
  { value: 'symmetrical', label: 'Symmetrical' },
  { value: 'asymmetrical', label: 'Asymmetrical' }
]

export const ImageVariations = ({ originalImage }: ImageVariationsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [variations, setVariations] = useState<GeneratedVariation[]>([])
  const [options, setOptions] = useState<VariationOptions>({
    intensity: 30,
    count: 3,
    style: 'none',
    mood: 'same',
    colorScheme: 'original',
    composition: 'same',
    promptModifier: ''
  })

  const generateVariations = async () => {
    setIsGenerating(true)
    setProgress(0)
    setVariations([])

    try {
      analytics.user.featureUsed('image_variations', {
        original_provider: originalImage.provider,
        variation_count: options.count,
        intensity: options.intensity
      })

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 15, 90))
      }, 500)

      // Create modified prompts for variations
      const basePrompt = originalImage.prompt
      const modifiedPrompts = Array.from({ length: options.count }, (_, i) => {
        let prompt = basePrompt

        // Apply style modifications
        if (options.style && options.style !== 'none') {
          prompt += `, ${options.style} style`
        }

        // Apply mood modifications
        if (options.mood && options.mood !== 'same') {
          prompt += `, ${options.mood} mood`
        }

        // Apply color scheme modifications
        if (options.colorScheme && options.colorScheme !== 'original') {
          prompt += `, ${options.colorScheme.replace('-', ' ')}`
        }

        // Apply composition modifications
        if (options.composition && options.composition !== 'same') {
          prompt += `, ${options.composition.replace('-', ' ')}`
        }

        // Apply custom prompt modifier
        if (options.promptModifier) {
          prompt += `, ${options.promptModifier}`
        }

        // Add variation intensity
        const intensityDescriptors = [
          'subtle variation',
          'slight variation', 
          'moderate variation',
          'significant variation',
          'major variation'
        ]
        const intensityLevel = Math.floor(options.intensity / 20)
        const intensityDesc = intensityDescriptors[Math.min(intensityLevel, 4)]
        
        prompt += `, ${intensityDesc}`

        return prompt
      })

      // Generate variations sequentially to avoid rate limits
      const newVariations: GeneratedVariation[] = []
      
      for (let i = 0; i < modifiedPrompts.length; i++) {
        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: modifiedPrompts[i],
              provider: originalImage.provider,
              aspectRatio: originalImage.metadata?.aspectRatio || '1:1',
              style: options.style === 'none' ? undefined : options.style
            })
          })

          const result = await response.json()

          if (result.success) {
            newVariations.push({
              id: `variation-${Date.now()}-${i}`,
              imageUrl: result.imageUrl,
              prompt: modifiedPrompts[i],
              intensity: options.intensity,
              metadata: result.metadata,
              createdAt: Date.now()
            })
            
            setVariations([...newVariations])
            setProgress(((i + 1) / modifiedPrompts.length) * 100)
          } else {
            console.error(`Variation ${i + 1} failed:`, result.error)
          }
        } catch (error) {
          console.error(`Error generating variation ${i + 1}:`, error)
        }

        // Small delay between generations
        if (i < modifiedPrompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      clearInterval(progressInterval)
      setProgress(100)

      if (newVariations.length > 0) {
        toast.success(`${newVariations.length} variações geradas com sucesso!`)
        analytics.user.featureUsed('variations_generated', {
          count: newVariations.length,
          success_rate: (newVariations.length / options.count) * 100
        })
      } else {
        toast.error('Não foi possível gerar nenhuma variação')
        analytics.error.caught(new Error('No variations generated'), 'image_variations')
      }

    } catch (error: any) {
      console.error('Variation generation error:', error)
      toast.error('Erro ao gerar variações')
      analytics.error.caught(error, 'image_variations')
    } finally {
      setIsGenerating(false)
      setTimeout(() => setProgress(0), 2000)
    }
  }

  const downloadVariation = async (variation: GeneratedVariation) => {
    try {
      // Handle base64 data URLs
      if (variation.imageUrl.startsWith('data:')) {
        const a = document.createElement('a')
        a.href = variation.imageUrl
        a.download = `variation-${variation.id}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        // Regular URLs
        const response = await fetch(variation.imageUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `variation-${variation.id}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

      analytics.user.imageDownloaded('variation')
      toast.success('Download iniciado!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Erro ao fazer download')
    }
  }

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    toast.success('Prompt copiado!')
    analytics.user.featureUsed('prompt_copied', { source: 'variations' })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shuffle className="w-4 h-4 mr-2" />
          Gerar Variações
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wand2 className="w-5 h-5 mr-2" />
            Gerador de Variações
          </DialogTitle>
          <DialogDescription>
            Crie variações da sua imagem com diferentes estilos, moods e composições
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Image Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Imagem Original</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <Image
                    src={originalImage.url}
                    alt="Original"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">Prompt original:</p>
                  <p className="text-sm bg-muted p-2 rounded text-wrap break-words">
                    {originalImage.prompt}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configurações das Variações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="count">Quantidade de Variações</Label>
                  <Select 
                    value={options.count.toString()} 
                    onValueChange={(value) => setOptions({...options, count: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} variação{n > 1 ? 'ões' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="intensity">Intensidade da Variação: {options.intensity}%</Label>
                  <Slider
                    value={[options.intensity]}
                    onValueChange={([value]) => setOptions({...options, intensity: value})}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {options.intensity < 20 && 'Muito sutil'}
                    {options.intensity >= 20 && options.intensity < 40 && 'Sutil'}
                    {options.intensity >= 40 && options.intensity < 60 && 'Moderada'}
                    {options.intensity >= 60 && options.intensity < 80 && 'Significativa'}
                    {options.intensity >= 80 && 'Muito diferente'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="style">Estilo</Label>
                  <Select value={options.style} onValueChange={(value) => setOptions({...options, style: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {variationStyles.map(style => (
                        <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mood">Mood</Label>
                  <Select value={options.mood} onValueChange={(value) => setOptions({...options, mood: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moodOptions.map(mood => (
                        <SelectItem key={mood.value} value={mood.value}>{mood.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="colorScheme">Esquema de Cores</Label>
                  <Select value={options.colorScheme} onValueChange={(value) => setOptions({...options, colorScheme: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorSchemes.map(scheme => (
                        <SelectItem key={scheme.value} value={scheme.value}>{scheme.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="composition">Composição</Label>
                  <Select value={options.composition} onValueChange={(value) => setOptions({...options, composition: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {compositionOptions.map(comp => (
                        <SelectItem key={comp.value} value={comp.value}>{comp.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="promptModifier">Modificador Personalizado (opcional)</Label>
                <Textarea
                  placeholder="Ex: com mais detalhes, estilo vintage, iluminação dramática..."
                  value={options.promptModifier}
                  onChange={(e) => setOptions({...options, promptModifier: e.target.value})}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button 
              onClick={generateVariations} 
              disabled={isGenerating}
              size="lg"
              className="px-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando {options.count} variações...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar {options.count} Variação{options.count > 1 ? 'ões' : ''}
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Generated Variations */}
          {variations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Grid3x3 className="w-5 h-5 mr-2" />
                  Variações Geradas ({variations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {variations.map((variation, index) => (
                      <div key={variation.id} className="border rounded-lg p-4 space-y-3">
                        <div className="relative aspect-square rounded-lg overflow-hidden border">
                          <Image
                            src={variation.imageUrl}
                            alt={`Variação ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">
                              Variação {index + 1}
                            </Badge>
                            <Badge variant="outline">
                              {options.intensity}% intensidade
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground bg-muted p-2 rounded text-wrap break-words">
                            {variation.prompt}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => copyPrompt(variation.prompt)}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copiar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => downloadVariation(variation)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImageVariations
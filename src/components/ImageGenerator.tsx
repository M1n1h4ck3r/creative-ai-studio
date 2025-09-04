'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Loader2, Download, Sparkles, Wand2, AlertCircle, DollarSign } from 'lucide-react'
import { useApiKeys } from '@/contexts/ApiKeyContext'
import { getProviderManager } from '@/lib/providers/manager'
import { ProviderType, GenerationOptions } from '@/lib/providers/types'

const generationSchema = z.object({
  prompt: z
    .string()
    .min(3, 'Prompt deve ter pelo menos 3 caracteres')
    .max(2000, 'Prompt não pode exceder 2000 caracteres'),
  provider: z.enum(['gemini', 'openai'] as const),
  aspectRatio: z.string(),
  style: z.string().optional(),
  negativePrompt: z.string().optional(),
})

type GenerationFormData = z.infer<typeof generationSchema>

interface GeneratedImage {
  url: string
  prompt: string
  provider: string
  metadata?: any
}

const aspectRatios = [
  { label: 'Quadrado (1:1)', value: '1:1', description: 'Instagram, Facebook' },
  { label: 'Stories (9:16)', value: '9:16', description: 'Instagram, WhatsApp Status' },
  { label: 'Landscape (16:9)', value: '16:9', description: 'YouTube, Google Ads' },
  { label: 'Vertical (4:5)', value: '4:5', description: 'Pinterest, Facebook' },
  { label: 'Banner (21:9)', value: '21:9', description: 'Website banners' },
]

const styles = [
  'Fotorealístico',
  'Arte digital',
  'Pintura a óleo',
  'Aquarela',
  'Desenho',
  'Cartoon',
  '3D render',
  'Cyberpunk',
  'Fantasia',
  'Minimalista'
]

export default function ImageGenerator() {
  const { hasApiKey } = useApiKeys()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  const [progress, setProgress] = useState(0)
  const [availableProviders, setAvailableProviders] = useState<ProviderType[]>([])
  const [costEstimate, setCostEstimate] = useState<{ provider: string; cost: number } | null>(null)

  const form = useForm<GenerationFormData>({
    resolver: zodResolver(generationSchema),
    defaultValues: {
      prompt: '',
      provider: 'gemini',
      aspectRatio: '1:1',
      style: '',
      negativePrompt: '',
    },
  })

  const watchedValues = form.watch()

  useEffect(() => {
    // Check which providers have API keys configured
    const providers: ProviderType[] = ['gemini', 'openai', 'stable-diffusion']
    const available = providers.filter(provider => hasApiKey(provider))
    setAvailableProviders(available)

    // Set first available provider as default
    if (available.length > 0 && !hasApiKey(watchedValues.provider)) {
      form.setValue('provider', available[0])
    }
  }, [hasApiKey, form, watchedValues.provider])

  useEffect(() => {
    // Update cost estimate when form values change
    const updateCostEstimate = async () => {
      if (watchedValues.prompt && watchedValues.provider) {
        try {
          const response = await fetch('/api/estimate-cost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: watchedValues.provider,
              prompt: watchedValues.prompt,
              aspectRatio: watchedValues.aspectRatio,
              style: watchedValues.style,
            }),
          })

          if (response.ok) {
            const estimate = await response.json()
            setCostEstimate(estimate)
          }
        } catch (error) {
          console.error('Error estimating cost:', error)
        }
      }
    }

    const debounce = setTimeout(updateCostEstimate, 500)
    return () => clearTimeout(debounce)
  }, [watchedValues])

  const onSubmit = async (data: GenerationFormData) => {
    if (!hasApiKey(data.provider)) {
      toast.error(`Configure a API key do ${data.provider} primeiro`)
      return
    }

    setIsGenerating(true)
    setProgress(0)
    
    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 500)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      clearInterval(progressInterval)
      setProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro na geração')
      }

      if (result.success) {
        const generatedImageData = {
          url: result.imageUrl,
          prompt: data.prompt,
          provider: data.provider,
          metadata: result.metadata
        }
        
        setGeneratedImage(generatedImageData)
        
        // Save to history
        if ((window as any).saveImageToHistory) {
          (window as any).saveImageToHistory({
            url: result.imageUrl,
            prompt: data.prompt,
            provider: data.provider,
            aspectRatio: data.aspectRatio,
            metadata: result.metadata
          })
        }
        
        toast.success('Imagem gerada com sucesso!')
      } else {
        throw new Error(result.error || 'Falha na geração')
      }
    } catch (error: any) {
      console.error('Generation error:', error)
      toast.error(error.message || 'Erro ao gerar imagem')
    } finally {
      setIsGenerating(false)
      setTimeout(() => setProgress(0), 2000)
    }
  }

  const downloadImage = async () => {
    if (!generatedImage) return

    try {
      // Check if it's a base64 data URL (for Gemini images)
      if (generatedImage.url.startsWith('data:')) {
        const a = document.createElement('a')
        a.href = generatedImage.url
        a.download = `gemini-image-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        // Regular URL (for other providers)
        const response = await fetch(generatedImage.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `generated-image-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
      
      toast.success('Download iniciado!')
    } catch (error) {
      toast.error('Erro ao fazer download')
    }
  }

  if (availableProviders.length === 0) {
    return (
      <Card className='max-w-2xl mx-auto'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted'>
            <AlertCircle className='h-6 w-6' />
          </div>
          <CardTitle>Configure suas API Keys</CardTitle>
          <CardDescription>
            Você precisa configurar pelo menos uma API key para começar a gerar imagens.
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center'>
          <Button onClick={() => window.location.href = '/settings'}>
            Ir para Configurações
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {/* Generation Form */}
      <Card>
        <CardHeader>
          <div className='flex items-center space-x-2'>
            <Wand2 className='h-5 w-5' />
            <CardTitle>Gerar Imagem</CardTitle>
          </div>
          <CardDescription>
            Descreva a imagem que você quer criar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='prompt'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição da Imagem</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Ex: Um gato fofo brincando em um jardim florido ao pôr do sol'
                        className='min-h-[100px] resize-none'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Seja específico e descritivo para melhores resultados
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='provider'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider de IA</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Selecione o provider' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableProviders.map((provider) => (
                            <SelectItem key={provider} value={provider}>
                              <div className='flex items-center space-x-2'>
                                <Sparkles className='h-4 w-4' />
                                <span className='capitalize'>{provider}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='aspectRatio'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formato</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Selecione o formato' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {aspectRatios.map((ratio) => (
                            <SelectItem key={ratio.value} value={ratio.value}>
                              <div>
                                <div className='font-medium'>{ratio.label}</div>
                                <div className='text-xs text-muted-foreground'>
                                  {ratio.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='style'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estilo (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Selecione um estilo' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value=''>Nenhum estilo específico</SelectItem>
                        {styles.map((style) => (
                          <SelectItem key={style} value={style.toLowerCase()}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='negativePrompt'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt Negativo (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Ex: low quality, blurry, distorted'
                        className='min-h-[60px] resize-none'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Descreva o que você NÃO quer na imagem
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {costEstimate && (
                <div className='flex items-center justify-between p-3 bg-muted rounded-lg'>
                  <div className='flex items-center space-x-2'>
                    <DollarSign className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>Custo estimado:</span>
                  </div>
                  <Badge variant='secondary'>
                    ${costEstimate.cost.toFixed(4)}
                  </Badge>
                </div>
              )}

              {isGenerating && (
                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Gerando imagem...</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              <Button 
                type='submit' 
                className='w-full' 
                disabled={isGenerating || availableProviders.length === 0}
                size='lg'
              >
                {isGenerating ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Wand2 className='mr-2 h-4 w-4' />
                    Gerar Imagem
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Generated Image Display */}
      <Card>
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
          <CardDescription>
            Sua imagem gerada aparecerá aqui
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className='space-y-4'>
              <Skeleton className='aspect-square w-full rounded-lg' />
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-6 w-20' />
                </div>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-12' />
                  <Skeleton className='h-12 w-full' />
                </div>
                <div className='flex space-x-2'>
                  <Skeleton className='h-3 w-16' />
                  <Skeleton className='h-3 w-20' />
                </div>
              </div>
            </div>
          ) : generatedImage ? (
            <div className='space-y-4'>
              <div className='relative group'>
                <Image
                  src={generatedImage.url}
                  alt={generatedImage.prompt}
                  width={512}
                  height={512}
                  className='w-full rounded-lg shadow-lg transition-transform duration-300 hover:scale-[1.02]'
                  onError={(e) => {
                    console.error('Image failed to load:', e)
                    toast.error('Erro ao carregar imagem')
                  }}
                />
                <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-center justify-center backdrop-blur-sm'>
                  <Button 
                    onClick={downloadImage}
                    variant='secondary'
                    size='sm'
                    className='glassmorphism'
                  >
                    <Download className='mr-2 h-4 w-4' />
                    Download
                  </Button>
                </div>
              </div>
              
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Provider:</span>
                  <Badge variant='outline' className='capitalize'>
                    {generatedImage.provider}
                  </Badge>
                </div>
                
                <div>
                  <span className='text-sm font-medium'>Prompt:</span>
                  <p className='text-sm text-muted-foreground mt-1 leading-relaxed'>
                    {generatedImage.prompt}
                  </p>
                </div>
                
                {generatedImage.metadata && (
                  <div className='text-xs text-muted-foreground space-y-1'>
                    <div>Tempo: {generatedImage.metadata.generationTime}ms</div>
                    {generatedImage.metadata.cost && (
                      <div>Custo: ${generatedImage.metadata.cost.toFixed(4)}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='aspect-square bg-gradient-to-br from-muted/50 to-muted rounded-lg flex items-center justify-center'>
              <div className='text-center space-y-2'>
                <Sparkles className='h-12 w-12 text-muted-foreground mx-auto animate-pulse' />
                <p className='text-muted-foreground'>
                  Aguardando geração
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
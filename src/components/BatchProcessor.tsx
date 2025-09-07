'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Plus, 
  Trash2, 
  Copy, 
  Upload,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shuffle
} from 'lucide-react'
import Image from 'next/image'
import { useApiKeys } from '@/contexts/ApiKeyContext'

interface BatchJob {
  id: string
  prompt: string
  provider: string
  aspectRatio: string
  style?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  imageUrl?: string
  error?: string
  startTime?: number
  endTime?: number
  cost?: number
}

interface BatchSettings {
  provider: string
  aspectRatio: string
  style: string
  quality: string
  simultaneousJobs: number
  retryFailures: boolean
  saveToDisk: boolean
}

const defaultSettings: BatchSettings = {
  provider: 'gemini',
  aspectRatio: '1:1',
  style: 'realistic',
  quality: 'standard',
  simultaneousJobs: 3,
  retryFailures: true,
  saveToDisk: true
}

export default function BatchProcessor() {
  const [jobs, setJobs] = useState<BatchJob[]>([])
  const [settings, setSettings] = useState<BatchSettings>(defaultSettings)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentJobIndex, setCurrentJobIndex] = useState(0)
  const [totalProgress, setTotalProgress] = useState(0)
  const [prompts, setPrompts] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  
  const { hasApiKey } = useApiKeys()

  // Add jobs from prompts
  const addJobsFromPrompts = useCallback(() => {
    const promptList = prompts
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)

    if (promptList.length === 0) {
      toast.error('Digite pelo menos um prompt')
      return
    }

    const newJobs: BatchJob[] = promptList.map((prompt, index) => ({
      id: `job-${Date.now()}-${index}`,
      prompt,
      provider: settings.provider,
      aspectRatio: settings.aspectRatio,
      style: settings.style,
      status: 'pending'
    }))

    setJobs(prev => [...prev, ...newJobs])
    setPrompts('')
    toast.success(`${newJobs.length} jobs adicionados à fila`)
  }, [prompts, settings])

  // Add single job
  const addSingleJob = useCallback((prompt: string) => {
    const newJob: BatchJob = {
      id: `job-${Date.now()}`,
      prompt,
      provider: settings.provider,
      aspectRatio: settings.aspectRatio,
      style: settings.style,
      status: 'pending'
    }

    setJobs(prev => [...prev, newJob])
    toast.success('Job adicionado')
  }, [settings])

  // Remove job
  const removeJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId))
  }, [])

  // Clear all jobs
  const clearJobs = useCallback(() => {
    setJobs([])
    setCurrentJobIndex(0)
    setTotalProgress(0)
  }, [])

  // Duplicate job
  const duplicateJob = useCallback((job: BatchJob) => {
    const newJob: BatchJob = {
      ...job,
      id: `job-${Date.now()}`,
      status: 'pending',
      imageUrl: undefined,
      error: undefined,
      startTime: undefined,
      endTime: undefined
    }
    setJobs(prev => [...prev, newJob])
    toast.success('Job duplicado')
  }, [])

  // Process single job
  const processJob = async (job: BatchJob): Promise<BatchJob> => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: job.prompt,
          provider: job.provider,
          aspectRatio: job.aspectRatio,
          style: job.style,
          quality: settings.quality
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Generation failed')
      }

      return {
        ...job,
        status: 'completed',
        imageUrl: result.imageUrl,
        endTime: Date.now(),
        cost: result.metadata?.cost || 0
      }
    } catch (error: any) {
      return {
        ...job,
        status: 'failed',
        error: error.message,
        endTime: Date.now()
      }
    }
  }

  // Start batch processing
  const startProcessing = useCallback(async () => {
    if (jobs.length === 0) {
      toast.error('Nenhum job na fila')
      return
    }

    if (!hasApiKey(settings.provider)) {
      toast.error(`Configure uma API key para ${settings.provider}`)
      return
    }

    setIsProcessing(true)
    setIsPaused(false)
    setCurrentJobIndex(0)

    const pendingJobs = jobs.filter(job => job.status === 'pending' || 
      (job.status === 'failed' && settings.retryFailures))

    if (pendingJobs.length === 0) {
      toast.error('Nenhum job pendente para processar')
      setIsProcessing(false)
      return
    }

    // Process jobs in batches based on simultaneousJobs setting
    let completedCount = 0
    const batchSize = settings.simultaneousJobs

    for (let i = 0; i < pendingJobs.length; i += batchSize) {
      if (isPaused) break

      const batch = pendingJobs.slice(i, i + batchSize)
      
      // Update jobs to processing status
      setJobs(prev => prev.map(job => 
        batch.find(b => b.id === job.id) 
          ? { ...job, status: 'processing', startTime: Date.now() }
          : job
      ))

      // Process batch concurrently
      const batchPromises = batch.map(job => processJob({
        ...job,
        status: 'processing',
        startTime: Date.now()
      }))

      try {
        const results = await Promise.all(batchPromises)
        
        // Update completed jobs
        setJobs(prev => prev.map(job => {
          const result = results.find(r => r.id === job.id)
          return result || job
        }))

        completedCount += results.length
        setCurrentJobIndex(completedCount)
        setTotalProgress((completedCount / pendingJobs.length) * 100)

        // Small delay between batches to prevent overwhelming the API
        if (i + batchSize < pendingJobs.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

      } catch (error: any) {
        toast.error(`Erro no batch: ${error.message}`)
        break
      }
    }

    setIsProcessing(false)
    const completedJobs = jobs.filter(job => job.status === 'completed').length
    const failedJobs = jobs.filter(job => job.status === 'failed').length
    
    toast.success(`Processamento concluído! ${completedJobs} sucessos, ${failedJobs} falhas`)
  }, [jobs, settings, hasApiKey, isPaused])

  // Pause processing
  const pauseProcessing = useCallback(() => {
    setIsPaused(true)
    toast.info('Processamento pausado')
  }, [])

  // Resume processing
  const resumeProcessing = useCallback(() => {
    setIsPaused(false)
    startProcessing()
  }, [startProcessing])

  // Stop processing
  const stopProcessing = useCallback(() => {
    setIsProcessing(false)
    setIsPaused(false)
    toast.info('Processamento interrompido')
  }, [])

  // Download all completed images
  const downloadAllImages = useCallback(() => {
    const completedJobs = jobs.filter(job => job.status === 'completed' && job.imageUrl)
    
    if (completedJobs.length === 0) {
      toast.error('Nenhuma imagem para download')
      return
    }

    completedJobs.forEach((job, index) => {
      if (job.imageUrl) {
        setTimeout(() => {
          const a = document.createElement('a')
          a.href = job.imageUrl!
          a.download = `batch-image-${index + 1}-${job.id}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }, index * 500) // Stagger downloads
      }
    })

    toast.success(`Iniciando download de ${completedJobs.length} imagens`)
  }, [jobs])

  // Get status counts
  const statusCounts = {
    pending: jobs.filter(job => job.status === 'pending').length,
    processing: jobs.filter(job => job.status === 'processing').length,
    completed: jobs.filter(job => job.status === 'completed').length,
    failed: jobs.filter(job => job.status === 'failed').length
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-500" />
      case 'processing': return <Zap className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Processamento em Lote</span>
              </CardTitle>
              <CardDescription>
                Gere múltiplas imagens automaticamente
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Configurações
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Configurações do Lote</DialogTitle>
                    <DialogDescription>
                      Ajuste as configurações para processamento
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Provider</Label>
                      <Select 
                        value={settings.provider} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, provider: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini">Google Gemini</SelectItem>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="replicate">Replicate</SelectItem>
                          <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Proporção</Label>
                      <Select 
                        value={settings.aspectRatio} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, aspectRatio: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1:1">Quadrado (1:1)</SelectItem>
                          <SelectItem value="16:9">Paisagem (16:9)</SelectItem>
                          <SelectItem value="9:16">Retrato (9:16)</SelectItem>
                          <SelectItem value="4:3">Clássico (4:3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Jobs Simultâneos: {settings.simultaneousJobs}</Label>
                      <Input
                        type="range"
                        min="1"
                        max="5"
                        value={settings.simultaneousJobs}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          simultaneousJobs: parseInt(e.target.value) 
                        }))}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.retryFailures}
                        onCheckedChange={(checked) => setSettings(prev => ({ 
                          ...prev, 
                          retryFailures: checked 
                        }))}
                      />
                      <Label>Repetir falhas automaticamente</Label>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status Overview */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">{statusCounts.pending}</div>
              <div className="text-sm text-muted-foreground">Pendente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{statusCounts.processing}</div>
              <div className="text-sm text-muted-foreground">Processando</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{statusCounts.completed}</div>
              <div className="text-sm text-muted-foreground">Concluído</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{statusCounts.failed}</div>
              <div className="text-sm text-muted-foreground">Falhou</div>
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso: {Math.round(totalProgress)}%</span>
                <span>{currentJobIndex} de {jobs.length}</span>
              </div>
              <Progress value={totalProgress} />
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex space-x-2">
            {!isProcessing ? (
              <Button onClick={startProcessing} disabled={jobs.length === 0}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Processamento
              </Button>
            ) : isPaused ? (
              <Button onClick={resumeProcessing}>
                <Play className="h-4 w-4 mr-2" />
                Continuar
              </Button>
            ) : (
              <Button onClick={pauseProcessing} variant="secondary">
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            )}
            
            {isProcessing && (
              <Button onClick={stopProcessing} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Parar
              </Button>
            )}

            <Button 
              onClick={downloadAllImages} 
              variant="outline"
              disabled={statusCounts.completed === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Todos
            </Button>

            <Button 
              onClick={clearJobs} 
              variant="outline"
              disabled={isProcessing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Fila
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Jobs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Adicionar Jobs</span>
          </CardTitle>
          <CardDescription>
            Digite um prompt por linha para adicionar múltiplos jobs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite seus prompts aqui, um por linha:&#10;&#10;Uma paisagem montanhosa ao pôr do sol&#10;Retrato de um gato preto com olhos verdes&#10;Arte abstrata com cores vibrantes"
            value={prompts}
            onChange={(e) => setPrompts(e.target.value)}
            rows={6}
          />
          <Button onClick={addJobsFromPrompts} disabled={!prompts.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Jobs
          </Button>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Fila de Jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum job na fila</p>
              <p className="text-sm">Adicione prompts acima para começar</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {jobs.map((job, index) => (
                  <Card key={job.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 pt-1">
                          {getStatusIcon(job.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                              #{index + 1} - {job.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {job.provider}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {job.aspectRatio}
                            </Badge>
                          </div>
                          
                          <p className="text-sm font-medium mb-2 line-clamp-2">
                            {job.prompt}
                          </p>

                          {job.status === 'failed' && job.error && (
                            <p className="text-xs text-red-600 mb-2">
                              Erro: {job.error}
                            </p>
                          )}

                          {job.status === 'completed' && job.imageUrl && (
                            <div className="mt-2">
                              <Image
                                src={job.imageUrl}
                                alt={job.prompt}
                                width={100}
                                height={100}
                                className="rounded object-cover"
                              />
                            </div>
                          )}

                          {(job.startTime && job.endTime) && (
                            <p className="text-xs text-muted-foreground">
                              Tempo: {((job.endTime - job.startTime) / 1000).toFixed(1)}s
                              {job.cost && ` • Custo: $${job.cost.toFixed(4)}`}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col space-y-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => duplicateJob(job)}
                            disabled={isProcessing}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                            onClick={() => removeJob(job.id)}
                            disabled={isProcessing && job.status === 'processing'}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
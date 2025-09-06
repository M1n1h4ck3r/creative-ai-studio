'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Download,
  Upload,
  Settings,
  Calendar,
  Clock,
  Database,
  FileArchive,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Trash2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { 
  backupManager, 
  BackupJob, 
  BackupConfig, 
  RestoreOptions, 
  RestoreResult,
  BackupData 
} from '@/lib/backup'
import { useAuth } from '@/contexts/AuthContext'

export const BackupDashboard: React.FC = () => {
  const { user } = useAuth()
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([])
  const [config, setConfig] = useState<BackupConfig>({
    enabled: true,
    frequency: 'weekly',
    retention: 30,
    includeFiles: true,
    includeProjects: true,
    includeUserData: true,
    includeAuditLogs: false,
    destinations: [
      {
        type: 'local',
        name: 'Local Storage',
        config: {},
        enabled: true
      }
    ]
  })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    overwriteExisting: false,
    includeFiles: true,
    includeProjects: true,
    includeUserData: true,
    includeAuditLogs: false,
    dryRun: true
  })
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null)

  useEffect(() => {
    if (user) {
      loadBackupJobs()
      loadConfig()
    }
  }, [user])

  const loadBackupJobs = async () => {
    try {
      if (!user) return
      const jobs = await backupManager.getBackupJobs(user.id)
      setBackupJobs(jobs)
    } catch (error) {
      console.error('Failed to load backup jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConfig = async () => {
    // In a real implementation, this would load from user settings
    // For now, using default config
  }

  const createBackup = async () => {
    if (!user) return
    
    setCreating(true)
    try {
      await backupManager.createBackup(user.id, config, 'manual')
      await loadBackupJobs()
    } catch (error) {
      console.error('Failed to create backup:', error)
    } finally {
      setCreating(false)
    }
  }

  const deleteBackup = async (jobId: string) => {
    if (!user) return
    
    try {
      await backupManager.deleteBackupJob(jobId, user.id)
      await loadBackupJobs()
    } catch (error) {
      console.error('Failed to delete backup:', error)
    }
  }

  const scheduleBackup = async () => {
    if (!user) return
    
    try {
      await backupManager.scheduleBackup(user.id, config)
    } catch (error) {
      console.error('Failed to schedule backup:', error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/json') {
      setRestoreFile(file)
    }
  }

  const restoreBackup = async () => {
    if (!user || !restoreFile) return
    
    setRestoring(true)
    try {
      const text = await restoreFile.text()
      const backupData: BackupData = JSON.parse(text)
      
      const result = await backupManager.restoreBackup(user.id, backupData, restoreOptions)
      setRestoreResult(result)
      
      if (!restoreOptions.dryRun && result.success) {
        // Reload data after successful restore
        await loadBackupJobs()
      }
    } catch (error) {
      setRestoreResult({
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed',
        restored_items: {
          projects: 0,
          generations: 0,
          templates: 0,
          files: 0,
          audit_logs: 0
        },
        skipped_items: 0,
        conflicts: []
      })
    } finally {
      setRestoring(false)
    }
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleString('pt-BR')
  }

  const getStatusIcon = (status: BackupJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'running':
        return <Loader className="w-4 h-4 text-blue-600 animate-spin" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: BackupJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin" />
        <span className="ml-2">Carregando backups...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Backup & Restauração</h1>
          <p className="text-muted-foreground">
            Gerencie backups automáticos e restaure dados quando necessário
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Restaurar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Restaurar Backup</DialogTitle>
                <DialogDescription>
                  Restaure dados de um arquivo de backup anterior
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Arquivo de Backup (JSON)</Label>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                  {restoreFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Arquivo: {restoreFile.name} ({formatFileSize(restoreFile.size)})
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Opções de Restauração</Label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="restore-overwrite"
                        checked={restoreOptions.overwriteExisting}
                        onCheckedChange={(checked) => 
                          setRestoreOptions(prev => ({ ...prev, overwriteExisting: checked }))
                        }
                      />
                      <Label htmlFor="restore-overwrite" className="text-sm">
                        Sobrescrever existentes
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="restore-files"
                        checked={restoreOptions.includeFiles}
                        onCheckedChange={(checked) => 
                          setRestoreOptions(prev => ({ ...prev, includeFiles: checked }))
                        }
                      />
                      <Label htmlFor="restore-files" className="text-sm">
                        Incluir arquivos
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="restore-projects"
                        checked={restoreOptions.includeProjects}
                        onCheckedChange={(checked) => 
                          setRestoreOptions(prev => ({ ...prev, includeProjects: checked }))
                        }
                      />
                      <Label htmlFor="restore-projects" className="text-sm">
                        Incluir projetos
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="restore-userdata"
                        checked={restoreOptions.includeUserData}
                        onCheckedChange={(checked) => 
                          setRestoreOptions(prev => ({ ...prev, includeUserData: checked }))
                        }
                      />
                      <Label htmlFor="restore-userdata" className="text-sm">
                        Incluir perfil
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="restore-audit"
                        checked={restoreOptions.includeAuditLogs}
                        onCheckedChange={(checked) => 
                          setRestoreOptions(prev => ({ ...prev, includeAuditLogs: checked }))
                        }
                      />
                      <Label htmlFor="restore-audit" className="text-sm">
                        Incluir logs de auditoria
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="restore-dryrun"
                        checked={restoreOptions.dryRun}
                        onCheckedChange={(checked) => 
                          setRestoreOptions(prev => ({ ...prev, dryRun: checked }))
                        }
                      />
                      <Label htmlFor="restore-dryrun" className="text-sm">
                        Simulação (não aplicar)
                      </Label>
                    </div>
                  </div>
                </div>

                {restoreResult && (
                  <div className={`p-3 rounded-lg ${
                    restoreResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <div className="font-medium">
                      {restoreResult.success ? 'Restauração concluída' : 'Erro na restauração'}
                    </div>
                    
                    {restoreResult.success && (
                      <div className="text-sm mt-1 space-y-1">
                        <p>Projetos: {restoreResult.restored_items.projects}</p>
                        <p>Gerações: {restoreResult.restored_items.generations}</p>
                        <p>Templates: {restoreResult.restored_items.templates}</p>
                        <p>Arquivos: {restoreResult.restored_items.files}</p>
                        {restoreResult.conflicts.length > 0 && (
                          <p>Conflitos: {restoreResult.conflicts.length}</p>
                        )}
                      </div>
                    )}
                    
                    {restoreResult.error && (
                      <p className="text-sm mt-1">{restoreResult.error}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={restoreBackup}
                    disabled={!restoreFile || restoring}
                    className="gap-2"
                  >
                    {restoring ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    {restoreOptions.dryRun ? 'Simular' : 'Restaurar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={createBackup} disabled={creating} className="gap-2">
            {creating ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Criar Backup
          </Button>
        </div>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Histórico</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          {backupJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileArchive className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum backup encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crie seu primeiro backup para começar a proteger seus dados
                </p>
                <Button onClick={createBackup} disabled={creating}>
                  Criar Primeiro Backup
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {backupJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <Badge className={getStatusColor(job.status)}>
                            {job.status === 'completed' && 'Concluído'}
                            {job.status === 'failed' && 'Falhou'}
                            {job.status === 'running' && 'Executando'}
                            {job.status === 'pending' && 'Pendente'}
                          </Badge>
                          <Badge variant="outline">
                            {job.type === 'manual' ? 'Manual' : 'Automático'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          {job.started_at && (
                            <p className="text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Iniciado: {formatDate(job.started_at)}
                            </p>
                          )}
                          
                          {job.completed_at && (
                            <p className="text-sm text-muted-foreground">
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Concluído: {formatDate(job.completed_at)}
                            </p>
                          )}
                          
                          {job.size_bytes && (
                            <p className="text-sm text-muted-foreground">
                              <Database className="w-3 h-3 inline mr-1" />
                              Tamanho: {formatFileSize(job.size_bytes)}
                            </p>
                          )}
                          
                          {job.items_count && (
                            <p className="text-sm text-muted-foreground">
                              <FileArchive className="w-3 h-3 inline mr-1" />
                              Items: {job.items_count}
                            </p>
                          )}
                        </div>
                        
                        {job.error && (
                          <p className="text-sm text-red-600">
                            Erro: {job.error}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {job.status === 'completed' && (
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Backup</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBackup(job.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações de Backup
              </CardTitle>
              <CardDescription>
                Configure backups automáticos e escolha o que incluir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Backup Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar backups automáticos programados
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
                />
              </div>

              {config.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select 
                      value={config.frequency}
                      onValueChange={(frequency: any) => setConfig(prev => ({ ...prev, frequency }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Retenção (dias)</Label>
                    <Input
                      type="number"
                      value={config.retention}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        retention: parseInt(e.target.value) || 30 
                      }))}
                      min="1"
                      max="365"
                    />
                    <p className="text-xs text-muted-foreground">
                      Backups mais antigos que este período serão excluídos automaticamente
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-3">
                <Label className="text-base font-medium">Conteúdo do Backup</Label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-files"
                      checked={config.includeFiles}
                      onCheckedChange={(includeFiles) => setConfig(prev => ({ ...prev, includeFiles }))}
                    />
                    <Label htmlFor="include-files" className="text-sm">
                      Arquivos e imagens
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-projects"
                      checked={config.includeProjects}
                      onCheckedChange={(includeProjects) => setConfig(prev => ({ ...prev, includeProjects }))}
                    />
                    <Label htmlFor="include-projects" className="text-sm">
                      Projetos
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-userdata"
                      checked={config.includeUserData}
                      onCheckedChange={(includeUserData) => setConfig(prev => ({ ...prev, includeUserData }))}
                    />
                    <Label htmlFor="include-userdata" className="text-sm">
                      Dados do perfil
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-audit"
                      checked={config.includeAuditLogs}
                      onCheckedChange={(includeAuditLogs) => setConfig(prev => ({ ...prev, includeAuditLogs }))}
                    />
                    <Label htmlFor="include-audit" className="text-sm">
                      Logs de auditoria
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={loadConfig}>
                  Cancelar
                </Button>
                <Button onClick={scheduleBackup}>
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BackupDashboard
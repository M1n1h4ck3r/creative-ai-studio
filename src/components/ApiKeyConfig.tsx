'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Eye, EyeOff, Key, Check, X, AlertCircle, Settings, Sparkles, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'

interface ApiKey {
  id: string
  provider: string
  key_name: string | null
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

interface Provider {
  id: string
  name: string
  icon: any
  description: string
  color: string
  testEndpoint?: string
  keyFormat: string
}

const providers: Provider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: Sparkles,
    description: 'Modelo avançado do Google para geração de imagens e texto',
    color: 'bg-blue-500',
    testEndpoint: 'https://generativelanguage.googleapis.com/v1/models',
    keyFormat: 'AIzaSy...'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: Zap,
    description: 'DALL-E 3 para geração de imagens de alta qualidade',
    color: 'bg-green-500',
    testEndpoint: 'https://api.openai.com/v1/models',
    keyFormat: 'sk-...'
  },
  {
    id: 'replicate',
    name: 'Replicate',
    icon: Key,
    description: 'Plataforma com múltiplos modelos de IA',
    color: 'bg-purple-500',
    testEndpoint: 'https://api.replicate.com/v1/models',
    keyFormat: 'r8_...'
  }
]

export default function ApiKeyConfig() {
  const { user } = useAuth()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [testingKey, setTestingKey] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini')
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadApiKeys()
    }
  }, [user])

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApiKeys(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar API keys')
    } finally {
      setLoading(false)
    }
  }

  const saveApiKey = async (provider: string, key: string, keyName?: string) => {
    if (!user) return

    try {
      setLoading(true)
      
      // Save via API route to handle encryption server-side
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          key,
          keyName: keyName || `${provider} Key`
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save API key')
      }

      toast.success('API key salva com sucesso!')
      await loadApiKeys()
    } catch (error: any) {
      toast.error('Erro ao salvar API key: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const testApiKey = async (provider: string, key: string) => {
    setTestingKey(provider)
    
    try {
      const response = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key })
      })

      const result = await response.json()
      
      if (result.valid) {
        toast.success('API key válida!')
        return true
      } else {
        toast.error('API key inválida: ' + result.error)
        return false
      }
    } catch (error) {
      toast.error('Erro ao testar API key')
      return false
    } finally {
      setTestingKey(null)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)

      if (error) throw error

      toast.success('API key removida')
      await loadApiKeys()
    } catch (error) {
      toast.error('Erro ao remover API key')
    }
  }

  const toggleShowKey = (providerId: string) => {
    setShowKey(prev => ({ ...prev, [providerId]: !prev[providerId] }))
  }

  const getProviderKey = (providerId: string): ApiKey | null => {
    return apiKeys.find(key => key.provider === providerId && key.is_active) || null
  }

  return (
    <Card className='w-full max-w-4xl'>
      <CardHeader>
        <div className='flex items-center space-x-2'>
          <Settings className='h-5 w-5' />
          <CardTitle>Configuração de API Keys</CardTitle>
        </div>
        <CardDescription>
          Configure suas chaves de API para os diferentes provedores de IA
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Alert className='mb-6'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Suas API keys são armazenadas de forma segura e criptografada. 
            Elas nunca são expostas no frontend.
          </AlertDescription>
        </Alert>

        <Tabs value={selectedProvider} onValueChange={setSelectedProvider}>
          <TabsList className='grid w-full grid-cols-3'>
            {providers.map(provider => (
              <TabsTrigger key={provider.id} value={provider.id}>
                <provider.icon className='w-4 h-4 mr-2' />
                {provider.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {providers.map(provider => {
            const existingKey = getProviderKey(provider.id)
            
            return (
              <TabsContent key={provider.id} value={provider.id} className='space-y-4'>
                <div className='flex items-start space-x-4'>
                  <div className={`${provider.color} p-3 rounded-lg`}>
                    <provider.icon className='h-6 w-6 text-white' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-lg'>{provider.name}</h3>
                    <p className='text-muted-foreground text-sm mb-3'>
                      {provider.description}
                    </p>
                    
                    {existingKey ? (
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between p-3 border rounded-lg'>
                          <div className='flex items-center space-x-3'>
                            <Badge variant='default' className='bg-green-500'>
                              <Check className='w-3 h-3 mr-1' />
                              Configurado
                            </Badge>
                            <span className='text-sm text-muted-foreground'>
                              Criado em: {new Date(existingKey.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => testApiKey(provider.id, existingKey.encrypted_key)}
                              disabled={testingKey === provider.id}
                            >
                              {testingKey === provider.id ? 'Testando...' : 'Testar'}
                            </Button>
                            <Button
                              variant='destructive'
                              size='sm'
                              onClick={() => deleteApiKey(existingKey.id)}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ApiKeyForm
                        provider={provider}
                        onSave={saveApiKey}
                        onTest={testApiKey}
                        testing={testingKey === provider.id}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface ApiKeyFormProps {
  provider: Provider
  onSave: (provider: string, key: string, keyName?: string) => Promise<void>
  onTest: (provider: string, key: string) => Promise<boolean>
  testing: boolean
}

function ApiKeyForm({ provider, onSave, onTest, testing }: ApiKeyFormProps) {
  const [key, setKey] = useState('')
  const [keyName, setKeyName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!key.trim()) {
      toast.error('Por favor, insira a API key')
      return
    }

    // Test the key first
    const isValid = await onTest(provider.id, key)
    
    if (isValid) {
      setSaving(true)
      await onSave(provider.id, key, keyName || `${provider.name} Key`)
      setSaving(false)
      setKey('')
      setKeyName('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4 p-4 border rounded-lg'>
      <div className='space-y-2'>
        <Label htmlFor={`${provider.id}-name`}>Nome da chave (opcional)</Label>
        <Input
          id={`${provider.id}-name`}
          placeholder={`Minha ${provider.name} Key`}
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
        />
      </div>
      
      <div className='space-y-2'>
        <Label htmlFor={`${provider.id}-key`}>API Key</Label>
        <Input
          id={`${provider.id}-key`}
          type='password'
          placeholder={provider.keyFormat}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          required
        />
        <p className='text-xs text-muted-foreground'>
          Formato esperado: {provider.keyFormat}
        </p>
      </div>

      <div className='flex space-x-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() => onTest(provider.id, key)}
          disabled={!key.trim() || testing}
        >
          {testing ? 'Testando...' : 'Testar Key'}
        </Button>
        
        <Button
          type='submit'
          disabled={!key.trim() || saving || testing}
        >
          {saving ? 'Salvando...' : 'Salvar Key'}
        </Button>
      </div>
    </form>
  )
}
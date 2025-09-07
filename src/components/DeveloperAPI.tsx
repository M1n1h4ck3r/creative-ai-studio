'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Code, 
  Zap,
  BookOpen,
  Settings,
  BarChart3,
  Shield,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface APIKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at?: string
  usage_count: number
  rate_limit: number
  scopes: string[]
  is_active: boolean
}

interface DeveloperAPIProps {
  className?: string
}

const AVAILABLE_SCOPES = [
  { value: 'generate', label: 'Generate Images', description: 'Create new images using AI providers' },
  { value: 'variations', label: 'Image Variations', description: 'Create variations of existing images' },
  { value: 'history', label: 'Access History', description: 'Read user\'s image generation history' },
  { value: 'analytics', label: 'Analytics', description: 'Access usage analytics and statistics' }
]

const EXAMPLE_CODE = {
  curl: `curl -X POST "https://your-domain.com/api/v1/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "provider": "openai",
    "aspectRatio": "16:9",
    "quality": "hd"
  }'`,
  
  javascript: `const response = await fetch('https://your-domain.com/api/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'A beautiful sunset over mountains',
    provider: 'openai',
    aspectRatio: '16:9',
    quality: 'hd'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Image URL:', data.data.imageUrl);
} else {
  console.error('Error:', data.error);
}`,
  
  python: `import requests

url = "https://your-domain.com/api/v1/generate"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "prompt": "A beautiful sunset over mountains",
    "provider": "openai",
    "aspectRatio": "16:9",
    "quality": "hd"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

if data.get("success"):
    print(f"Image URL: {data['data']['imageUrl']}")
else:
    print(f"Error: {data.get('error')}")`
}

export default function DeveloperAPI({ className }: DeveloperAPIProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  
  // Create API Key form
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['generate'])
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000)
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/developer/keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.keys)
      } else {
        toast.error('Failed to fetch API keys')
      }
    } catch (error) {
      toast.error('Error fetching API keys')
    } finally {
      setIsLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    if (newKeyScopes.length === 0) {
      toast.error('Please select at least one scope')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          scopes: newKeyScopes,
          rateLimit: newKeyRateLimit
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedApiKey(data.apiKey)
        setNewKeyName('')
        setNewKeyScopes(['generate'])
        setNewKeyRateLimit(1000)
        await fetchApiKeys()
        toast.success('API key created successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create API key')
      }
    } catch (error) {
      toast.error('Error creating API key')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/developer/keys?id=${keyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchApiKeys()
        toast.success('API key deleted successfully')
      } else {
        toast.error('Failed to delete API key')
      }
    } catch (error) {
      toast.error('Error deleting API key')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const handleScopeToggle = (scope: string) => {
    setNewKeyScopes(prev => 
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Code className="h-5 w-5" />
          <span>Developer API</span>
        </CardTitle>
        <CardDescription>
          Integrate Creative AI Studio into your applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{apiKeys.length}</p>
                      <p className="text-xs text-muted-foreground">Active Keys</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {apiKeys.reduce((sum, key) => sum + key.usage_count, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Requests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {apiKeys.reduce((sum, key) => sum + key.rate_limit, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Rate Limit/min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Start</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Get started with the Creative AI Studio API in minutes:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Create an API key in the "API Keys" tab</li>
                  <li>Configure your AI provider keys (OpenAI, Gemini, etc.)</li>
                  <li>Make your first API request using the documentation</li>
                  <li>Monitor usage and performance in Analytics</li>
                </ol>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                API access requires a configured AI provider (OpenAI, Gemini, etc.) in your account settings.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">API Keys</h3>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create API Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New API Key</DialogTitle>
                    <DialogDescription>
                      Create a new API key to access Creative AI Studio programmatically
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="My App Integration"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Rate Limit (requests per minute)</Label>
                      <Select value={newKeyRateLimit.toString()} onValueChange={(v) => setNewKeyRateLimit(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100 requests/min</SelectItem>
                          <SelectItem value="500">500 requests/min</SelectItem>
                          <SelectItem value="1000">1,000 requests/min</SelectItem>
                          <SelectItem value="5000">5,000 requests/min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Scopes</Label>
                      <div className="space-y-2">
                        {AVAILABLE_SCOPES.map((scope) => (
                          <div key={scope.value} className="flex items-start space-x-2">
                            <input
                              type="checkbox"
                              id={scope.value}
                              checked={newKeyScopes.includes(scope.value)}
                              onChange={() => handleScopeToggle(scope.value)}
                              className="mt-1"
                            />
                            <div className="space-y-1">
                              <Label htmlFor={scope.value} className="text-sm font-medium">
                                {scope.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">{scope.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createApiKey} disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Key'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Show generated API key */}
            {generatedApiKey && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="space-y-2">
                  <p className="font-medium text-green-800">Your API key has been created!</p>
                  <div className="flex items-center space-x-2">
                    <code className="bg-white p-2 rounded text-sm font-mono flex-1">
                      {generatedApiKey}
                    </code>
                    <Button size="sm" onClick={() => copyToClipboard(generatedApiKey)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-green-700">
                    Save this key securely - you won't be able to see it again!
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setGeneratedApiKey(null)}
                  >
                    I've saved it securely
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* API Keys List */}
            <div className="space-y-2">
              {apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No API keys created yet</p>
                  <p className="text-sm text-muted-foreground">Create your first API key to get started</p>
                </div>
              ) : (
                apiKeys.map((key) => (
                  <Card key={key.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{key.name}</span>
                            <Badge variant={key.is_active ? 'default' : 'secondary'}>
                              {key.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Key: {key.key_prefix}</span>
                            <span>Usage: {key.usage_count} requests</span>
                            <span>Limit: {key.rate_limit}/min</span>
                            <span>Created: {formatDate(key.created_at)}</span>
                            {key.last_used_at && (
                              <span>Last used: {formatDate(key.last_used_at)}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {key.scopes.map((scope) => (
                              <Badge key={scope} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteApiKey(key.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">API Documentation</h3>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    All API requests must include your API key in the Authorization header:
                  </p>
                  <div className="bg-muted p-3 rounded-md">
                    <code className="text-sm">Authorization: Bearer YOUR_API_KEY</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Base URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-md">
                    <code className="text-sm">https://your-domain.com/api/v1</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Generate Image</CardTitle>
                  <CardDescription>POST /api/v1/generate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Request Body</h4>
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <pre>{JSON.stringify({
                        prompt: "A beautiful sunset over mountains",
                        provider: "openai", // optional, defaults to openai
                        aspectRatio: "16:9", // optional, defaults to 1:1
                        style: "photographic", // optional
                        model: "dall-e-3", // optional
                        quality: "hd" // optional, defaults to standard
                      }, null, 2)}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Response</h4>
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <pre>{JSON.stringify({
                        success: true,
                        data: {
                          imageUrl: "https://...",
                          prompt: "A beautiful sunset over mountains",
                          provider: "openai",
                          aspectRatio: "16:9",
                          generationTime: 3542,
                          cost: { usdCost: 0.04, credits: 1 }
                        },
                        usage: {
                          rateLimitRemaining: 999,
                          rateLimitReset: "2024-01-20T10:30:00Z"
                        }
                      }, null, 2)}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Code Examples */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Code Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="curl">
                    <TabsList>
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                    </TabsList>

                    <TabsContent value="curl">
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                          <code>{EXAMPLE_CODE.curl}</code>
                        </pre>
                        <Button
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(EXAMPLE_CODE.curl)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="javascript">
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                          <code>{EXAMPLE_CODE.javascript}</code>
                        </pre>
                        <Button
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(EXAMPLE_CODE.javascript)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="python">
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                          <code>{EXAMPLE_CODE.python}</code>
                        </pre>
                        <Button
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(EXAMPLE_CODE.python)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <h3 className="text-lg font-semibold">API Analytics</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Usage by API Key</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="flex justify-between items-center">
                        <span className="text-sm">{key.name}</span>
                        <Badge variant="outline">{key.usage_count} requests</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rate Limits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="flex justify-between items-center">
                        <span className="text-sm">{key.name}</span>
                        <Badge variant="outline">{key.rate_limit}/min</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <BarChart3 className="h-4 w-4" />
              <AlertDescription>
                Detailed analytics including request patterns, error rates, and performance metrics coming soon.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
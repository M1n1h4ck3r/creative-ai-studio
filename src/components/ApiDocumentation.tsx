'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Book,
  Code,
  Copy,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  Lock,
  Globe,
  Zap,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react'
import { API_DOCUMENTATION, API_INFO, SECURITY_SCHEMES, COMMON_ERRORS, ApiEndpoint } from '@/lib/api-docs'
import { useAuth } from '@/contexts/AuthContext'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export const ApiDocumentation: React.FC = () => {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string>('AI Generation')
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [testRequest, setTestRequest] = useState<any>({})
  const [testResponse, setTestResponse] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))

  const categories = Object.keys(API_DOCUMENTATION)
  
  // Filter endpoints based on search
  const filteredEndpoints = React.useMemo(() => {
    if (!searchQuery) return API_DOCUMENTATION

    const filtered: typeof API_DOCUMENTATION = {}
    
    for (const [category, endpoints] of Object.entries(API_DOCUMENTATION)) {
      const matchingEndpoints = endpoints.filter(endpoint =>
        endpoint.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        endpoint.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      
      if (matchingEndpoints.length > 0) {
        filtered[category] = matchingEndpoints
      }
    }
    
    return filtered
  }, [searchQuery])

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800'
      case 'POST': return 'bg-blue-100 text-blue-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      case 'PATCH': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const generateCurlCommand = (endpoint: ApiEndpoint): string => {
    const baseUrl = API_INFO.servers[0].url
    let curl = `curl -X ${endpoint.method} "${baseUrl}${endpoint.path}"`
    
    // Add headers
    curl += ' \\\n  -H "Content-Type: application/json"'
    
    if (endpoint.security?.some(s => s.type === 'http')) {
      curl += ' \\\n  -H "Authorization: Bearer YOUR_JWT_TOKEN"'
    }
    
    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody) {
      const example = endpoint.requestBody.content['application/json']?.example
      if (example) {
        curl += ` \\\n  -d '${JSON.stringify(example, null, 2)}'`
      }
    }
    
    return curl
  }

  const generateCodeExample = (endpoint: ApiEndpoint, language: string): string => {
    const baseUrl = API_INFO.servers[0].url
    const example = endpoint.requestBody?.content['application/json']?.example

    switch (language) {
      case 'javascript':
        return `const response = await fetch('${baseUrl}${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json',
    ${endpoint.security?.some(s => s.type === 'http') ? "'Authorization': 'Bearer YOUR_JWT_TOKEN'," : ''}
  },${example ? `
  body: JSON.stringify(${JSON.stringify(example, null, 2)})` : ''}
});

const data = await response.json();
console.log(data);`

      case 'python':
        return `import requests

url = '${baseUrl}${endpoint.path}'
headers = {
    'Content-Type': 'application/json',
    ${endpoint.security?.some(s => s.type === 'http') ? "'Authorization': 'Bearer YOUR_JWT_TOKEN'" : ''}
}
${example ? `
data = ${JSON.stringify(example, null, 2).replace(/"/g, "'")}

response = requests.${endpoint.method.toLowerCase()}(url, headers=headers, json=data)` : `
response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)`}
print(response.json())`

      case 'curl':
        return generateCurlCommand(endpoint)

      default:
        return generateCurlCommand(endpoint)
    }
  }

  const testEndpoint = async () => {
    if (!selectedEndpoint || !user) return

    setTestLoading(true)
    try {
      const token = await user.getIdToken() // Assuming Firebase auth
      
      const response = await fetch(`/api${selectedEndpoint.path}`, {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: ['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) 
          ? JSON.stringify(testRequest) 
          : undefined
      })

      const data = await response.json()
      setTestResponse({
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: data
      })
    } catch (error) {
      setTestResponse({
        status: 0,
        error: error instanceof Error ? error.message : 'Request failed'
      })
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-gray-50 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Book className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold">{API_INFO.title}</h1>
              <p className="text-sm text-muted-foreground">v{API_INFO.version}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Overview Section */}
          <Collapsible 
            open={expandedSections.has('overview')}
            onOpenChange={() => toggleSection('overview')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-100 rounded">
              <span className="font-medium">Overview</span>
              {expandedSections.has('overview') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 ml-4">
              <Button variant="ghost" size="sm" className="justify-start w-full">
                <Globe className="w-4 h-4 mr-2" />
                Getting Started
              </Button>
              <Button variant="ghost" size="sm" className="justify-start w-full">
                <Lock className="w-4 h-4 mr-2" />
                Authentication
              </Button>
              <Button variant="ghost" size="sm" className="justify-start w-full">
                <AlertCircle className="w-4 h-4 mr-2" />
                Error Handling
              </Button>
              <Button variant="ghost" size="sm" className="justify-start w-full">
                <Zap className="w-4 h-4 mr-2" />
                Rate Limiting
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {/* API Endpoints by Category */}
          {Object.entries(filteredEndpoints).map(([category, endpoints]) => (
            <Collapsible 
              key={category}
              open={expandedSections.has(category)}
              onOpenChange={() => toggleSection(category)}
            >
              <CollapsibleTrigger 
                className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-100 rounded"
                onClick={() => setSelectedCategory(category)}
              >
                <span className="font-medium">{category}</span>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {endpoints.length}
                  </Badge>
                  {expandedSections.has(category) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 ml-4">
                {endpoints.map((endpoint) => (
                  <Button
                    key={endpoint.id}
                    variant="ghost"
                    size="sm"
                    className={`justify-start w-full ${selectedEndpoint?.id === endpoint.id ? 'bg-blue-50 text-blue-700' : ''}`}
                    onClick={() => setSelectedEndpoint(endpoint)}
                  >
                    <Badge className={`mr-2 text-xs ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </Badge>
                    <span className="truncate">{endpoint.summary}</span>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedEndpoint ? (
          <div className="p-6">
            {/* Endpoint Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={getMethodColor(selectedEndpoint.method)}>
                  {selectedEndpoint.method}
                </Badge>
                <code className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                  {selectedEndpoint.path}
                </code>
                {selectedEndpoint.deprecated && (
                  <Badge variant="destructive">Deprecated</Badge>
                )}
              </div>
              
              <h1 className="text-2xl font-bold mb-2">{selectedEndpoint.summary}</h1>
              <p className="text-muted-foreground">{selectedEndpoint.description}</p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedEndpoint.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
                <TabsTrigger value="try-it">Try It</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Security Requirements */}
                {selectedEndpoint.security && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Authentication
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedEndpoint.security.map((security, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="outline">{security.type}</Badge>
                            <span className="text-sm">{security.description}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Parameters */}
                {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Parameters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedEndpoint.parameters.map((param) => (
                          <div key={param.name} className="border-b pb-3 last:border-b-0">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {param.name}
                              </code>
                              <Badge variant={param.required ? 'default' : 'secondary'}>
                                {param.required ? 'required' : 'optional'}
                              </Badge>
                              <Badge variant="outline">{param.schema.type}</Badge>
                              <Badge variant="outline">{param.in}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{param.description}</p>
                            {param.example && (
                              <p className="text-xs text-blue-600 mt-1">
                                Example: <code>{JSON.stringify(param.example)}</code>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Request Body */}
                {selectedEndpoint.requestBody && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Request Body</CardTitle>
                      <CardDescription>{selectedEndpoint.requestBody.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(selectedEndpoint.requestBody.content).map(([contentType, mediaType]) => (
                          <div key={contentType}>
                            <Badge variant="outline" className="mb-2">{contentType}</Badge>
                            {mediaType.example && (
                              <div className="relative">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="absolute top-2 right-2 z-10"
                                  onClick={() => copyToClipboard(JSON.stringify(mediaType.example, null, 2))}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <SyntaxHighlighter
                                  language="json"
                                  style={vscDarkPlus}
                                  customStyle={{ fontSize: '12px', maxHeight: '300px' }}
                                >
                                  {JSON.stringify(mediaType.example, null, 2)}
                                </SyntaxHighlighter>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Responses */}
                <Card>
                  <CardHeader>
                    <CardTitle>Responses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(selectedEndpoint.responses).map(([statusCode, response]) => (
                        <div key={statusCode} className="border rounded p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              className={
                                statusCode.startsWith('2') ? 'bg-green-100 text-green-800' :
                                statusCode.startsWith('4') ? 'bg-yellow-100 text-yellow-800' :
                                statusCode.startsWith('5') ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {statusCode}
                            </Badge>
                            <span className="text-sm">{response.description}</span>
                          </div>
                          
                          {response.content && Object.entries(response.content).map(([contentType, mediaType]) => (
                            <div key={contentType} className="mt-2">
                              <Badge variant="outline" className="text-xs">{contentType}</Badge>
                              {mediaType.example && (
                                <div className="relative mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="absolute top-2 right-2 z-10"
                                    onClick={() => copyToClipboard(JSON.stringify(mediaType.example, null, 2))}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <SyntaxHighlighter
                                    language="json"
                                    style={vscDarkPlus}
                                    customStyle={{ fontSize: '11px', maxHeight: '200px' }}
                                  >
                                    {JSON.stringify(mediaType.example, null, 2)}
                                  </SyntaxHighlighter>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Rate Limiting */}
                {selectedEndpoint.rateLimit && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Rate Limiting
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>{selectedEndpoint.rateLimit.requests} requests</strong> {selectedEndpoint.rateLimit.window}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedEndpoint.rateLimit.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="examples" className="space-y-4">
                <div className="grid gap-4">
                  {['curl', 'javascript', 'python'].map((language) => (
                    <Card key={language}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm capitalize">{language}</CardTitle>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(generateCodeExample(selectedEndpoint, language))}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <SyntaxHighlighter
                          language={language === 'curl' ? 'bash' : language}
                          style={vscDarkPlus}
                          customStyle={{ fontSize: '12px' }}
                        >
                          {generateCodeExample(selectedEndpoint, language)}
                        </SyntaxHighlighter>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Live Examples */}
                {selectedEndpoint.examples.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Live Examples</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {selectedEndpoint.examples.map((example, index) => (
                          <div key={index} className="border rounded p-4">
                            <h4 className="font-medium mb-2">{example.name}</h4>
                            <p className="text-sm text-muted-foreground mb-4">{example.description}</p>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm font-medium mb-2">Request</h5>
                                <SyntaxHighlighter
                                  language="json"
                                  style={vscDarkPlus}
                                  customStyle={{ fontSize: '11px' }}
                                >
                                  {JSON.stringify(example.request, null, 2)}
                                </SyntaxHighlighter>
                              </div>
                              
                              <div>
                                <h5 className="text-sm font-medium mb-2">Response</h5>
                                <SyntaxHighlighter
                                  language="json"
                                  style={vscDarkPlus}
                                  customStyle={{ fontSize: '11px' }}
                                >
                                  {JSON.stringify(example.response, null, 2)}
                                </SyntaxHighlighter>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="try-it" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Try this endpoint
                    </CardTitle>
                    <CardDescription>
                      Test the API endpoint directly from the documentation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Request Builder */}
                    {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
                      <div>
                        <label className="text-sm font-medium">Request Body</label>
                        <Textarea
                          placeholder="Enter JSON request body..."
                          value={JSON.stringify(testRequest, null, 2)}
                          onChange={(e) => {
                            try {
                              setTestRequest(JSON.parse(e.target.value || '{}'))
                            } catch (error) {
                              // Invalid JSON, keep as string for now
                            }
                          }}
                          className="font-mono text-sm"
                          rows={8}
                        />
                      </div>
                    )}

                    <Button 
                      onClick={testEndpoint}
                      disabled={testLoading || !user}
                      className="w-full"
                    >
                      {testLoading ? 'Sending...' : 'Send Request'}
                    </Button>

                    {!user && (
                      <p className="text-sm text-muted-foreground text-center">
                        Please log in to test the API endpoints
                      </p>
                    )}

                    {/* Response */}
                    {testResponse && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Response</span>
                          <Badge 
                            className={
                              testResponse.status >= 200 && testResponse.status < 300 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {testResponse.status || 'Error'}
                          </Badge>
                        </div>
                        
                        <SyntaxHighlighter
                          language="json"
                          style={vscDarkPlus}
                          customStyle={{ fontSize: '12px', maxHeight: '400px' }}
                        >
                          {JSON.stringify(testResponse, null, 2)}
                        </SyntaxHighlighter>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* Welcome Page */
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">{API_INFO.title}</h1>
                <p className="text-muted-foreground text-lg mb-4">{API_INFO.description}</p>
                <Badge variant="outline">Version {API_INFO.version}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      AI Generation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Generate text, images, and code using multiple AI providers
                    </p>
                    <Button variant="outline" size="sm">
                      Explore →
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Manage and use templates for consistent content generation
                    </p>
                    <Button variant="outline" size="sm">
                      Explore →
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-purple-600" />
                      Authentication
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Secure your API requests with JWT authentication
                    </p>
                    <Button variant="outline" size="sm">
                      Learn More →
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Start</CardTitle>
                  <CardDescription>
                    Get started with the Creative AI Studio API in minutes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">1. Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      All API requests require authentication using JWT tokens. Include your token in the Authorization header.
                    </p>
                    <SyntaxHighlighter
                      language="bash"
                      style={vscDarkPlus}
                      customStyle={{ fontSize: '12px' }}
                    >
                      {`curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  https://api.creativeaistudio.com/api/generate`}
                    </SyntaxHighlighter>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">2. Make Your First Request</h4>
                    <p className="text-sm text-muted-foreground">
                      Try generating some content with our AI generation endpoint.
                    </p>
                    <SyntaxHighlighter
                      language="bash"
                      style={vscDarkPlus}
                      customStyle={{ fontSize: '12px' }}
                    >
                      {`curl -X POST https://api.creativeaistudio.com/api/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "type": "text",
    "prompt": "Write a welcome email for new users",
    "provider": "openai"
  }'`}
                    </SyntaxHighlighter>
                  </div>

                  <div className="flex gap-2">
                    <Button>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Full Documentation
                    </Button>
                    <Button variant="outline">
                      Get API Key
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApiDocumentation
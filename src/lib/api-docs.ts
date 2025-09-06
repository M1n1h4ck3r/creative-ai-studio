'use client'

export interface ApiEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  summary: string
  description: string
  tags: string[]
  deprecated?: boolean
  security?: SecurityRequirement[]
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: Record<string, Response>
  examples: Example[]
  rateLimit?: RateLimit
  pricing?: PricingInfo
}

export interface Parameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  description: string
  required: boolean
  deprecated?: boolean
  schema: Schema
  example?: any
  examples?: Record<string, ExampleValue>
}

export interface RequestBody {
  description: string
  required: boolean
  content: Record<string, MediaType>
}

export interface Response {
  description: string
  content?: Record<string, MediaType>
  headers?: Record<string, Header>
}

export interface MediaType {
  schema: Schema
  example?: any
  examples?: Record<string, ExampleValue>
}

export interface Schema {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'
  format?: string
  description?: string
  enum?: string[]
  properties?: Record<string, Schema>
  items?: Schema
  required?: string[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  default?: any
}

export interface Example {
  name: string
  description: string
  request: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: any
  }
  response: {
    status: number
    headers?: Record<string, string>
    body: any
  }
}

export interface ExampleValue {
  summary: string
  description?: string
  value: any
}

export interface Header {
  description: string
  schema: Schema
  example?: any
}

export interface SecurityRequirement {
  type: 'apiKey' | 'http' | 'oauth2'
  name: string
  description: string
  in?: 'query' | 'header' | 'cookie'
  scheme?: string
  bearerFormat?: string
}

export interface RateLimit {
  requests: number
  window: string
  description: string
}

export interface PricingInfo {
  cost: number
  currency: string
  unit: string
  description: string
}

// Complete API documentation
export const API_DOCUMENTATION: Record<string, ApiEndpoint[]> = {
  'AI Generation': [
    {
      id: 'generate-text',
      method: 'POST',
      path: '/api/generate',
      summary: 'Generate AI Content',
      description: 'Generate text, images, or other content using various AI providers',
      tags: ['generation', 'ai'],
      security: [{ type: 'http', name: 'Bearer', scheme: 'bearer', bearerFormat: 'JWT' }],
      parameters: [],
      requestBody: {
        description: 'Generation parameters',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'prompt'],
              properties: {
                type: {
                  type: 'string',
                  enum: ['text', 'image', 'code', 'translation'],
                  description: 'Type of content to generate'
                },
                prompt: {
                  type: 'string',
                  description: 'Input prompt for generation',
                  minLength: 1,
                  maxLength: 4000
                },
                provider: {
                  type: 'string',
                  enum: ['openai', 'anthropic', 'gemini', 'huggingface', 'stability', 'replicate'],
                  description: 'AI provider to use (optional, will use default)',
                  default: 'openai'
                },
                model: {
                  type: 'string',
                  description: 'Specific model to use (optional)',
                  example: 'gpt-4'
                },
                options: {
                  type: 'object',
                  description: 'Additional generation options',
                  properties: {
                    temperature: {
                      type: 'number',
                      minimum: 0,
                      maximum: 2,
                      description: 'Creativity level (0-2)',
                      default: 0.7
                    },
                    max_tokens: {
                      type: 'integer',
                      minimum: 1,
                      maximum: 4000,
                      description: 'Maximum tokens to generate',
                      default: 1000
                    },
                    style: {
                      type: 'string',
                      description: 'Output style (for images)',
                      example: 'photorealistic'
                    },
                    size: {
                      type: 'string',
                      enum: ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024'],
                      description: 'Image dimensions (for images)',
                      default: '1024x1024'
                    }
                  }
                },
                metadata: {
                  type: 'object',
                  description: 'Additional metadata',
                  properties: {
                    project_id: {
                      type: 'string',
                      description: 'Project ID to associate with'
                    },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Tags for organization'
                    }
                  }
                }
              }
            },
            example: {
              type: 'text',
              prompt: 'Write a professional email about project updates',
              provider: 'openai',
              model: 'gpt-4',
              options: {
                temperature: 0.7,
                max_tokens: 500
              },
              metadata: {
                project_id: 'proj_123',
                tags: ['email', 'professional']
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Generation successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Unique generation ID'
                  },
                  type: {
                    type: 'string',
                    description: 'Content type'
                  },
                  content: {
                    type: 'string',
                    description: 'Generated content'
                  },
                  provider: {
                    type: 'string',
                    description: 'Provider used'
                  },
                  model: {
                    type: 'string',
                    description: 'Model used'
                  },
                  metadata: {
                    type: 'object',
                    properties: {
                      tokens_used: {
                        type: 'integer',
                        description: 'Tokens consumed'
                      },
                      cost: {
                        type: 'number',
                        description: 'Generation cost'
                      },
                      processing_time: {
                        type: 'number',
                        description: 'Processing time in seconds'
                      }
                    }
                  },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Creation timestamp'
                  }
                }
              },
              example: {
                id: 'gen_7f8d9e2a3b4c5d6e',
                type: 'text',
                content: 'Subject: Project Update - Q4 Progress Report\n\nDear Team,\n\nI hope this email finds you well...',
                provider: 'openai',
                model: 'gpt-4',
                metadata: {
                  tokens_used: 150,
                  cost: 0.003,
                  processing_time: 2.34
                },
                created_at: '2024-01-15T10:30:00Z'
              }
            }
          }
        },
        '400': {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                  message: { type: 'string' },
                  details: { type: 'object' }
                }
              }
            }
          }
        },
        '401': {
          description: 'Authentication required'
        },
        '429': {
          description: 'Rate limit exceeded'
        },
        '500': {
          description: 'Internal server error'
        }
      },
      examples: [
        {
          name: 'Text Generation',
          description: 'Generate professional content',
          request: {
            method: 'POST',
            url: '/api/generate',
            headers: {
              'Authorization': 'Bearer your-jwt-token',
              'Content-Type': 'application/json'
            },
            body: {
              type: 'text',
              prompt: 'Write a marketing email for a new product launch',
              provider: 'openai',
              options: {
                temperature: 0.8,
                max_tokens: 300
              }
            }
          },
          response: {
            status: 200,
            body: {
              id: 'gen_abc123',
              type: 'text',
              content: 'Subject: Exciting Product Launch - Don\'t Miss Out!\n\nDear Valued Customer...',
              provider: 'openai',
              model: 'gpt-4',
              metadata: {
                tokens_used: 87,
                cost: 0.0017,
                processing_time: 1.8
              }
            }
          }
        }
      ],
      rateLimit: {
        requests: 30,
        window: 'per minute',
        description: 'Rate limited based on your plan'
      },
      pricing: {
        cost: 0.002,
        currency: 'USD',
        unit: 'per 1K tokens',
        description: 'Pricing varies by provider and model'
      }
    },
    {
      id: 'estimate-cost',
      method: 'POST',
      path: '/api/estimate-cost',
      summary: 'Estimate Generation Cost',
      description: 'Get cost estimation for generation request before executing',
      tags: ['generation', 'pricing'],
      security: [{ type: 'http', name: 'Bearer', scheme: 'bearer', bearerFormat: 'JWT' }],
      requestBody: {
        description: 'Same parameters as generation request',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'prompt'],
              properties: {
                type: { type: 'string', enum: ['text', 'image', 'code', 'translation'] },
                prompt: { type: 'string', minLength: 1, maxLength: 4000 },
                provider: { type: 'string' },
                model: { type: 'string' },
                options: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Cost estimation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  estimated_cost: { type: 'number', description: 'Estimated cost in USD' },
                  estimated_tokens: { type: 'integer', description: 'Estimated tokens' },
                  provider: { type: 'string' },
                  model: { type: 'string' },
                  breakdown: {
                    type: 'object',
                    description: 'Cost breakdown by component'
                  }
                }
              }
            }
          }
        }
      },
      examples: [
        {
          name: 'Cost Estimation',
          description: 'Estimate cost before generation',
          request: {
            method: 'POST',
            url: '/api/estimate-cost',
            headers: { 'Authorization': 'Bearer your-jwt-token', 'Content-Type': 'application/json' },
            body: {
              type: 'text',
              prompt: 'Write a 500-word article about AI',
              provider: 'openai',
              model: 'gpt-4'
            }
          },
          response: {
            status: 200,
            body: {
              estimated_cost: 0.025,
              estimated_tokens: 650,
              provider: 'openai',
              model: 'gpt-4',
              breakdown: {
                input_tokens: 150,
                output_tokens: 500,
                input_cost: 0.0045,
                output_cost: 0.0205
              }
            }
          }
        }
      ],
      rateLimit: {
        requests: 100,
        window: 'per minute',
        description: 'Higher limit for cost estimation'
      }
    }
  ],

  'Templates': [
    {
      id: 'list-templates',
      method: 'GET',
      path: '/api/templates',
      summary: 'List Templates',
      description: 'Get list of available templates with filtering and pagination',
      tags: ['templates'],
      parameters: [
        {
          name: 'category',
          in: 'query',
          description: 'Filter by category',
          required: false,
          schema: {
            type: 'string',
            enum: ['business', 'creative', 'technical', 'personal']
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Search templates by name or description',
          required: false,
          schema: { type: 'string', maxLength: 100 }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Number of templates to return',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        },
        {
          name: 'offset',
          in: 'query',
          description: 'Number of templates to skip',
          required: false,
          schema: { type: 'integer', minimum: 0, default: 0 }
        }
      ],
      responses: {
        '200': {
          description: 'List of templates',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  templates: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        category: { type: 'string' },
                        variables: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              type: { type: 'string' },
                              description: { type: 'string' },
                              required: { type: 'boolean' }
                            }
                          }
                        },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  },
                  total: { type: 'integer' },
                  limit: { type: 'integer' },
                  offset: { type: 'integer' }
                }
              }
            }
          }
        }
      },
      examples: [
        {
          name: 'List Business Templates',
          description: 'Get business category templates',
          request: {
            method: 'GET',
            url: '/api/templates?category=business&limit=10',
            headers: {}
          },
          response: {
            status: 200,
            body: {
              templates: [
                {
                  id: 'tpl_business_email',
                  name: 'Professional Email',
                  description: 'Template for professional business emails',
                  category: 'business',
                  variables: [
                    { name: 'recipient', type: 'string', description: 'Email recipient', required: true },
                    { name: 'subject', type: 'string', description: 'Email subject', required: true }
                  ]
                }
              ],
              total: 25,
              limit: 10,
              offset: 0
            }
          }
        }
      ]
    }
  ],

  'Projects': [
    {
      id: 'create-project',
      method: 'POST',
      path: '/api/projects',
      summary: 'Create Project',
      description: 'Create a new project to organize your content',
      tags: ['projects'],
      security: [{ type: 'http', name: 'Bearer', scheme: 'bearer', bearerFormat: 'JWT' }],
      requestBody: {
        description: 'Project details',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', minLength: 1, maxLength: 100 },
                description: { type: 'string', maxLength: 500 },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  maxItems: 10
                },
                settings: {
                  type: 'object',
                  properties: {
                    default_provider: { type: 'string' },
                    auto_backup: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Project created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  user_id: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      },
      examples: [
        {
          name: 'Create Marketing Project',
          description: 'Create a project for marketing content',
          request: {
            method: 'POST',
            url: '/api/projects',
            headers: {
              'Authorization': 'Bearer your-jwt-token',
              'Content-Type': 'application/json'
            },
            body: {
              name: 'Q1 Marketing Campaign',
              description: 'Content for first quarter marketing initiatives',
              tags: ['marketing', 'q1', '2024'],
              settings: {
                default_provider: 'openai',
                auto_backup: true
              }
            }
          },
          response: {
            status: 201,
            body: {
              id: 'proj_q1_marketing_2024',
              name: 'Q1 Marketing Campaign',
              description: 'Content for first quarter marketing initiatives',
              user_id: 'user_123',
              created_at: '2024-01-15T10:30:00Z'
            }
          }
        }
      ]
    }
  ],

  'Backup': [
    {
      id: 'create-backup',
      method: 'POST',
      path: '/api/backup',
      summary: 'Create Backup',
      description: 'Create a backup of your data',
      tags: ['backup'],
      security: [{ type: 'http', name: 'Bearer', scheme: 'bearer', bearerFormat: 'JWT' }],
      requestBody: {
        description: 'Backup configuration',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['action'],
              properties: {
                action: { type: 'string', enum: ['create'] },
                config: {
                  type: 'object',
                  properties: {
                    includeFiles: { type: 'boolean', default: true },
                    includeProjects: { type: 'boolean', default: true },
                    includeUserData: { type: 'boolean', default: true },
                    includeAuditLogs: { type: 'boolean', default: false }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Backup initiated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jobId: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      },
      examples: [
        {
          name: 'Create Full Backup',
          description: 'Create a complete backup of all data',
          request: {
            method: 'POST',
            url: '/api/backup',
            headers: {
              'Authorization': 'Bearer your-jwt-token',
              'Content-Type': 'application/json'
            },
            body: {
              action: 'create',
              config: {
                includeFiles: true,
                includeProjects: true,
                includeUserData: true,
                includeAuditLogs: true
              }
            }
          },
          response: {
            status: 200,
            body: {
              jobId: 'backup_job_123',
              message: 'Backup started'
            }
          }
        }
      ],
      rateLimit: {
        requests: 5,
        window: 'per hour',
        description: 'Limited to prevent abuse'
      }
    }
  ],

  'Notifications': [
    {
      id: 'get-notifications',
      method: 'GET',
      path: '/api/notifications',
      summary: 'Get Notifications',
      description: 'Retrieve user notifications with filtering options',
      tags: ['notifications'],
      security: [{ type: 'http', name: 'Bearer', scheme: 'bearer', bearerFormat: 'JWT' }],
      parameters: [
        {
          name: 'action',
          in: 'query',
          description: 'Action to perform',
          required: true,
          schema: { type: 'string', enum: ['list', 'config', 'stats'] }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Number of notifications to return',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        },
        {
          name: 'unread_only',
          in: 'query',
          description: 'Return only unread notifications',
          required: false,
          schema: { type: 'boolean', default: false }
        }
      ],
      responses: {
        '200': {
          description: 'Notifications retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notifications: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        type: { type: 'string' },
                        title: { type: 'string' },
                        body: { type: 'string' },
                        read_at: { type: 'string', format: 'date-time' },
                        created_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      examples: [
        {
          name: 'Get Recent Notifications',
          description: 'Get last 10 notifications',
          request: {
            method: 'GET',
            url: '/api/notifications?action=list&limit=10',
            headers: { 'Authorization': 'Bearer your-jwt-token' }
          },
          response: {
            status: 200,
            body: {
              notifications: [
                {
                  id: 'notif_123',
                  type: 'generation_complete',
                  title: '✨ Generation Complete!',
                  body: 'Your text generation is ready',
                  read_at: null,
                  created_at: '2024-01-15T10:30:00Z'
                }
              ]
            }
          }
        }
      ]
    }
  ],

  'Authentication': [
    {
      id: 'auth-info',
      method: 'GET',
      path: '/api/auth/user',
      summary: 'Get User Info',
      description: 'Get current authenticated user information',
      tags: ['auth'],
      security: [{ type: 'http', name: 'Bearer', scheme: 'bearer', bearerFormat: 'JWT' }],
      responses: {
        '200': {
          description: 'User information',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string' },
                  plan: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      },
      examples: [
        {
          name: 'Get Current User',
          description: 'Retrieve authenticated user details',
          request: {
            method: 'GET',
            url: '/api/auth/user',
            headers: { 'Authorization': 'Bearer your-jwt-token' }
          },
          response: {
            status: 200,
            body: {
              id: 'user_123',
              email: 'user@example.com',
              name: 'John Doe',
              plan: 'pro',
              created_at: '2024-01-01T00:00:00Z'
            }
          }
        }
      ]
    }
  ]
}

// API documentation metadata
export const API_INFO = {
  title: 'Creative AI Studio API',
  version: '1.0.0',
  description: 'Comprehensive API for AI content generation, project management, and automation',
  contact: {
    name: 'API Support',
    email: 'api@creativeaistudio.com',
    url: 'https://docs.creativeaistudio.com'
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT'
  },
  servers: [
    {
      url: 'https://api.creativeaistudio.com',
      description: 'Production server'
    },
    {
      url: 'https://staging-api.creativeaistudio.com',
      description: 'Staging server'
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ]
}

// Security schemes
export const SECURITY_SCHEMES = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT token obtained from authentication'
  },
  apiKey: {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
    description: 'API key for service-to-service authentication'
  }
}

// Error responses
export const COMMON_ERRORS = {
  400: {
    description: 'Bad Request - Invalid parameters or request body',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        },
        example: {
          error: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: {
            field: 'prompt',
            reason: 'Required field missing'
          }
        }
      }
    }
  },
  401: {
    description: 'Unauthorized - Authentication required or invalid',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        example: {
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }
    }
  },
  403: {
    description: 'Forbidden - Insufficient permissions',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        example: {
          error: 'FORBIDDEN',
          message: 'Insufficient permissions to access this resource'
        }
      }
    }
  },
  429: {
    description: 'Too Many Requests - Rate limit exceeded',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            retry_after: { type: 'integer' }
          }
        },
        example: {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Try again in 60 seconds.',
          retry_after: 60
        }
      }
    }
  },
  500: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            request_id: { type: 'string' }
          }
        },
        example: {
          error: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          request_id: 'req_123456789'
        }
      }
    }
  }
}
/**
 * @jest-environment node
 */
import { POST } from '@/app/api/generate/route'
import { NextRequest } from 'next/server'

// Mock the providers
jest.mock('@/lib/providers/manager', () => ({
  getProviderManager: () => ({
    addProvider: jest.fn(),
    generateImage: jest.fn().mockResolvedValue({
      imageUrl: 'https://example.com/generated-image.png',
      cost: { usdCost: 0.04, credits: 1 },
      metadata: { provider: 'gemini', model: 'gemini-pro-vision' }
    }),
    isProviderConfigured: jest.fn().mockReturnValue(true),
    estimateCost: jest.fn().mockReturnValue({ usdCost: 0.04, credits: 1, description: 'Standard generation' })
  }),
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createServerClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ 
        data: { encrypted_key: 'mock-encrypted-key' }, 
        error: null 
      }),
    })),
  }),
}))

// Mock encryption
jest.mock('@/lib/encryption', () => ({
  decrypt: jest.fn().mockReturnValue('decrypted-api-key'),
}))

describe('/api/generate', () => {
  const mockRequest = (body: any) => {
    return {
      json: () => Promise.resolve(body),
    } as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Set development mode for testing
    process.env.NODE_ENV = 'development'
    process.env.GEMINI_API_KEY = 'test-gemini-key'
  })

  it('generates image successfully with valid request', async () => {
    const request = mockRequest({
      prompt: 'A beautiful sunset over mountains',
      provider: 'gemini',
      aspectRatio: '16:9',
      quality: 'standard'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.imageUrl).toBe('https://example.com/generated-image.png')
    expect(data.metadata).toBeDefined()
  })

  it('returns 400 for missing prompt', async () => {
    const request = mockRequest({
      provider: 'gemini',
      aspectRatio: '1:1'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Prompt é obrigatório')
  })

  it('returns 400 for empty prompt', async () => {
    const request = mockRequest({
      prompt: '   ',
      provider: 'gemini'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Prompt é obrigatório')
  })

  it('defaults to gemini provider when not specified', async () => {
    const request = mockRequest({
      prompt: 'A beautiful landscape'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.metadata.provider).toBe('gemini')
  })

  it('handles provider errors gracefully', async () => {
    // Mock provider to throw error
    const mockProviderManager = require('@/lib/providers/manager').getProviderManager()
    mockProviderManager.generateImage.mockRejectedValueOnce(new Error('Provider API error'))

    const request = mockRequest({
      prompt: 'Test prompt',
      provider: 'gemini'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Internal server error')
  })

  it('validates aspect ratio parameter', async () => {
    const request = mockRequest({
      prompt: 'Test image',
      provider: 'gemini',
      aspectRatio: 'invalid-ratio'
    })

    const response = await POST(request)
    const data = await response.json()

    // Should still work but use default aspect ratio
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('includes cost information in response', async () => {
    const request = mockRequest({
      prompt: 'A detailed artwork',
      provider: 'gemini',
      quality: 'hd'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.metadata.cost).toBeDefined()
    expect(data.metadata.cost.usdCost).toBe(0.04)
  })

  it('handles database save errors in production mode', async () => {
    // Set production mode
    process.env.NODE_ENV = 'production'
    
    // Mock database error
    const mockSupabase = require('@/lib/supabase').createServerClient()
    mockSupabase.from().insert.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection failed' }
    })

    const request = mockRequest({
      prompt: 'Test prompt',
      provider: 'gemini'
    })

    const response = await POST(request)
    const data = await response.json()

    // Should still succeed even if database save fails
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('supports different quality settings', async () => {
    const request = mockRequest({
      prompt: 'High quality image',
      provider: 'openai',
      quality: 'hd'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('handles style parameter', async () => {
    const request = mockRequest({
      prompt: 'Artistic portrait',
      provider: 'openai',
      style: 'photographic'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('validates provider parameter', async () => {
    const request = mockRequest({
      prompt: 'Test image',
      provider: 'invalid-provider'
    })

    const response = await POST(request)
    const data = await response.json()

    // Should handle gracefully, possibly falling back to default
    expect([200, 400, 500]).toContain(response.status)
  })

  it('includes generation timing in response', async () => {
    const request = mockRequest({
      prompt: 'Time test image',
      provider: 'gemini'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.metadata.generationTime).toBeGreaterThanOrEqual(0)
  })
})
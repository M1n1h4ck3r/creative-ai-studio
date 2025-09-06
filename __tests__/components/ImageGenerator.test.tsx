import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImageGenerator from '@/components/ImageGenerator'

// Mock the API key context
const mockGetApiKey = jest.fn((provider: string) => {
  const keys: Record<string, string> = {
    'gemini': 'test-gemini-key',
    'openai': 'test-openai-key',
  }
  return keys[provider] || null
})

const mockContextValue = {
  apiKeys: [],
  loading: false,
  getApiKey: mockGetApiKey,
  refreshApiKeys: jest.fn(),
  hasApiKey: jest.fn((provider: string) => ['gemini', 'openai'].includes(provider)),
  updateLastUsed: jest.fn(),
}

// Mock the ApiKeyContext
jest.mock('@/contexts/ApiKeyContext', () => ({
  useApiKeys: () => mockContextValue,
  ApiKeyProvider: ({ children }: { children: React.ReactNode }) => children,
}))

const MockProvider = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
)

describe('ImageGenerator Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
  })

  it('renders the component correctly', () => {
    render(
      <MockProvider>
        <ImageGenerator />
      </MockProvider>
    )

    expect(screen.getByText('Gerador de Imagens')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Descreva a imagem que você deseja gerar...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gerar imagem/i })).toBeInTheDocument()
  })

  it('shows provider selection', () => {
    render(
      <MockProvider>
        <ImageGenerator />
      </MockProvider>
    )

    expect(screen.getByText('Provider')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('validates prompt input', async () => {
    render(
      <MockProvider>
        <ImageGenerator />
      </MockProvider>
    )

    const generateButton = screen.getByRole('button', { name: /gerar imagem/i })
    
    // Try to generate without prompt
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(screen.getByText(/por favor, insira uma descrição/i)).toBeInTheDocument()
    })
  })

  it('generates image with valid input', async () => {
    // Mock API response
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
      success: true,
      imageUrl: 'https://example.com/generated-image.png',
      provider: 'gemini'
    })

    render(
      <MockProvider>
        <ImageGenerator />
      </MockProvider>
    )

    const promptInput = screen.getByPlaceholderText('Descreva a imagem que você deseja gerar...')
    const generateButton = screen.getByRole('button', { name: /gerar imagem/i })

    // Fill in the prompt
    fireEvent.change(promptInput, { target: { value: 'A beautiful sunset over mountains' } })
    
    // Generate image
    fireEvent.click(generateButton)

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText(/gerando/i)).toBeInTheDocument()
    })

    // Check success state
    await waitFor(() => {
      expect(screen.getByAltText('Generated image')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('A beautiful sunset over mountains')
    }))
  })

  it('handles generation errors gracefully', async () => {
    // Mock API response
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
      error: 'API key is invalid'
    }, 400)

    render(
      <MockProvider>
        <ImageGenerator />
      </MockProvider>
    )

    const promptInput = screen.getByPlaceholderText('Descreva a imagem que você deseja gerar...')
    const generateButton = screen.getByRole('button', { name: /gerar imagem/i })

    fireEvent.change(promptInput, { target: { value: 'Test prompt' } })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/erro na geração/i)).toBeInTheDocument()
    })
  })

  it('shows provider configuration when no API key available', () => {
    const NoApiKeyProvider = ({ children }: { children: React.ReactNode }) => (
      <ApiKeyProvider value={{
        apiKeys: {},
        addApiKey: jest.fn(),
        removeApiKey: jest.fn(),
        updateApiKey: jest.fn(),
        loading: false,
        error: null
      } as any}>
        {children}
      </ApiKeyProvider>
    )

    render(
      <NoApiKeyProvider>
        <ImageGenerator />
      </NoApiKeyProvider>
    )

    expect(screen.getByText(/configure suas api keys/i)).toBeInTheDocument()
  })

  it('updates prompt with template selection', () => {
    render(
      <MockProvider>
        <ImageGenerator />
      </MockProvider>
    )

    const promptInput = screen.getByPlaceholderText('Descreva a imagem que você deseja gerar...')
    
    // Find and click a template button (if available)
    const templateButtons = screen.getAllByRole('button')
    const portraitTemplate = templateButtons.find(button => 
      button.textContent?.includes('Retrato')
    )

    if (portraitTemplate) {
      fireEvent.click(portraitTemplate)
      
      expect(promptInput).toHaveValue(expect.stringContaining('retrato'))
    }
  })

  it('handles provider switching', async () => {
    render(
      <MockProvider>
        <ImageGenerator />
      </MockProvider>
    )

    const providerSelect = screen.getByRole('combobox')
    
    // Change provider
    fireEvent.change(providerSelect, { target: { value: 'openai' } })
    
    await waitFor(() => {
      expect(providerSelect).toHaveValue('openai')
    })
  })

  it('shows image history when available', async () => {
    // Mock local storage with previous generations
    const mockHistory = [
      {
        id: '1',
        prompt: 'Test prompt',
        imageUrl: 'https://example.com/test1.png',
        provider: 'gemini',
        timestamp: new Date().toISOString()
      }
    ]
    
    ;(global as any).localStorage.getItem.mockReturnValue(JSON.stringify(mockHistory))

    render(
      <MockProvider>
        <ImageGenerator />
      </MockProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Test prompt')).toBeInTheDocument()
    })
  })

  it('allows downloading generated images', async () => {
    // Mock API response
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
      success: true,
      imageUrl: 'https://example.com/generated-image.png',
      provider: 'gemini'
    })

    // Mock URL.createObjectURL and download functionality
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
    const mockDownloadLink = {
      click: jest.fn(),
      href: '',
      download: '',
      style: { display: '' }
    }
    document.createElement = jest.fn().mockReturnValue(mockDownloadLink)
    document.body.appendChild = jest.fn()
    document.body.removeChild = jest.fn()

    render(
      <MockProvider>
        <ImageGenerator />
      </MockProvider>
    )

    const promptInput = screen.getByPlaceholderText('Descreva a imagem que você deseja gerar...')
    fireEvent.change(promptInput, { target: { value: 'Test image' } })
    
    const generateButton = screen.getByRole('button', { name: /gerar imagem/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByAltText('Generated image')).toBeInTheDocument()
    })

    // Find and click download button
    const downloadButton = screen.getByRole('button', { name: /download/i })
    fireEvent.click(downloadButton)

    expect(document.createElement).toHaveBeenCalledWith('a')
    expect(mockDownloadLink.click).toHaveBeenCalled()
  })
})
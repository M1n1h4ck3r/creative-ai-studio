import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check which API keys are available from environment variables
    const availableProviders = []

    if (process.env.GEMINI_API_KEY) {
      availableProviders.push('gemini')
    }
    
    if (process.env.OPENAI_API_KEY) {
      availableProviders.push('openai')
    }
    
    if (process.env.REPLICATE_API_TOKEN) {
      availableProviders.push('replicate')
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      availableProviders.push('anthropic')
    }

    // Check stable diffusion - usually uses Replicate or a separate service
    if (process.env.REPLICATE_API_TOKEN || process.env.HUGGINGFACE_API_KEY) {
      availableProviders.push('stable-diffusion')
    }

    return NextResponse.json({
      success: true,
      availableProviders,
      hasAnyKey: availableProviders.length > 0
    })

  } catch (error: any) {
    console.error('Error checking API keys:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        availableProviders: [],
        hasAnyKey: false
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { provider, key } = await request.json()

    if (!provider || !key) {
      return NextResponse.json(
        { valid: false, error: 'Provider and key are required' },
        { status: 400 }
      )
    }

    let isValid = false
    let error = ''

    switch (provider) {
      case 'gemini':
        try {
          const genAI = new GoogleGenerativeAI(key)
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

          // Test with a simple prompt
          const result = await model.generateContent('Hello')
          isValid = !!result.response
        } catch (err: any) {
          error = err.message || 'Invalid Gemini API key'
        }
        break

      case 'openai':
        try {
          const openai = new OpenAI({ apiKey: key })

          // Test by listing models
          const models = await openai.models.list()
          isValid = !!models.data
        } catch (err: any) {
          error = err.message || 'Invalid OpenAI API key'
        }
        break

      case 'replicate':
        try {
          // Test Replicate API
          const response = await fetch('https://api.replicate.com/v1/models', {
            headers: {
              'Authorization': `Token ${key}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            isValid = true
          } else {
            const errorData = await response.json()
            error = errorData.detail || 'Invalid Replicate API key'
          }
        } catch (err: any) {
          error = err.message || 'Invalid Replicate API key'
        }
        break

      default:
        return NextResponse.json(
          { valid: false, error: 'Unsupported provider' },
          { status: 400 }
        )
    }

    return NextResponse.json({ valid: isValid, error })
  } catch (error: any) {
    console.error('API key test error:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
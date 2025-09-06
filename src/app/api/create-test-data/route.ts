import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { encrypt } from '@/lib/encryption'

export async function POST() {
  try {
    const supabase = createServerClient()
    
    // Get users to create test data for
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError || !authData?.users?.length) {
      return NextResponse.json({
        success: false,
        error: 'No users found'
      })
    }
    
    const results = []
    
    for (const user of authData.users) {
      // 1. Create a test API key
      try {
        const testApiKey = 'test-key-' + Math.random().toString(36).substring(7)
        const encryptedKey = await encrypt(testApiKey)
        
        const { data: apiKeyData, error: keyError } = await supabase
          .from('api_keys')
          .insert({
            user_id: user.id,
            provider: 'gemini',
            encrypted_key: encryptedKey,
            key_name: 'Test Gemini Key',
            is_active: true
          })
          .select()
          
        if (!keyError) {
          results.push({
            user_id: user.id,
            email: user.email,
            api_key_created: true,
            api_key_id: apiKeyData?.[0]?.id
          })
        }
      } catch (keyErr: any) {
        results.push({
          user_id: user.id,
          email: user.email,
          api_key_created: false,
          api_key_error: keyErr.message
        })
      }
      
      // 2. Create test generations
      const testGenerations = [
        {
          user_id: user.id,
          provider: 'gemini',
          prompt: 'Uma bela paisagem montanhosa ao pôr do sol',
          model_used: 'gemini-2.5-flash',
          image_url: 'https://picsum.photos/512/512?random=1',
          format: '1:1',
          generation_time_ms: 3500,
          cost_credits: 1,
          status: 'completed'
        },
        {
          user_id: user.id,
          provider: 'gemini',
          prompt: 'Um gato fofo dormindo em uma janela',
          model_used: 'gemini-2.5-flash',
          image_url: 'https://picsum.photos/512/512?random=2',
          format: '1:1',
          generation_time_ms: 2800,
          cost_credits: 1,
          status: 'completed'
        },
        {
          user_id: user.id,
          provider: 'openai',
          prompt: 'Arte digital futurística com neon',
          model_used: 'dall-e-3',
          image_url: 'https://picsum.photos/512/512?random=3',
          format: '1:1',
          generation_time_ms: 4200,
          cost_credits: 2,
          status: 'completed'
        }
      ]
      
      try {
        const { data: generationData, error: genError } = await supabase
          .from('generations')
          .insert(testGenerations)
          .select()
          
        results[results.length - 1] = {
          ...results[results.length - 1],
          generations_created: !genError,
          generations_count: generationData?.length || 0,
          generation_error: genError?.message
        }
      } catch (genErr: any) {
        results[results.length - 1] = {
          ...results[results.length - 1],
          generations_created: false,
          generation_error: genErr.message
        }
      }
      
      // 3. Create test analytics events
      const testAnalytics = [
        {
          event_name: 'image_generated',
          properties: { provider: 'gemini', success: true }
        },
        {
          event_name: 'api_key_added',
          properties: { provider: 'gemini' }
        },
        {
          event_name: 'page_view',
          properties: { page: 'dashboard' }
        }
      ]
      
      try {
        const { error: analyticsError } = await supabase
          .from('analytics_events')
          .insert(testAnalytics)
          
        results[results.length - 1] = {
          ...results[results.length - 1],
          analytics_created: !analyticsError,
          analytics_error: analyticsError?.message
        }
      } catch (analyticsErr: any) {
        results[results.length - 1] = {
          ...results[results.length - 1],
          analytics_created: false,
          analytics_error: analyticsErr.message
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      results,
      summary: {
        users_processed: authData.users.length,
        api_keys_created: results.filter(r => r.api_key_created).length,
        generations_created: results.reduce((sum, r) => sum + (r.generations_count || 0), 0),
        analytics_created: results.filter(r => r.analytics_created).length
      }
    })
    
  } catch (error: any) {
    console.error('Create test data error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
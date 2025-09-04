import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { encrypt } from '@/lib/encryption'
import type { InsertApiKey, UpdateApiKey } from '@/types/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Please login to continue' },
        { status: 401 }
      )
    }
    
    const user = session.user

    const { provider, key, keyName } = await request.json()

    if (!provider || !key) {
      return NextResponse.json(
        { error: 'Provider and key are required' },
        { status: 400 }
      )
    }

    // Encrypt the API key
    const encryptedKey = encrypt(key)

    // First, deactivate any existing key for this provider
    const { error: deactivateError } = await supabase
      .from('api_keys')
      .update({ is_active: false } satisfies UpdateApiKey)
      .eq('user_id', user.id)
      .eq('provider', provider)

    if (deactivateError) {
      console.error('Error deactivating old keys:', deactivateError)
    }

    // Then insert the new key
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        provider,
        encrypted_key: encryptedKey,
        key_name: keyName || `${provider} Key`,
        is_active: true
      } satisfies InsertApiKey)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to save API key')
    }

    return NextResponse.json({ 
      success: true, 
      id: data.id,
      message: 'API key saved successfully' 
    })
  } catch (error: any) {
    console.error('API key save error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, provider, key_name, is_active, last_used_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch API keys')
    }

    return NextResponse.json({ apiKeys: data })
  } catch (error: any) {
    console.error('API keys fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id) // Ensure user can only delete their own keys

    if (error) {
      throw new Error('Failed to delete API key')
    }

    return NextResponse.json({ 
      success: true,
      message: 'API key deleted successfully' 
    })
  } catch (error: any) {
    console.error('API key delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
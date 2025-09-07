import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { randomBytes } from 'crypto'

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

    // Get user's developer API keys
    const { data: apiKeys, error } = await supabase
      .from('developer_api_keys')
      .select(`
        id,
        name,
        key_prefix,
        created_at,
        last_used_at,
        is_active,
        usage_count,
        rate_limit,
        scopes
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      )
    }

    return NextResponse.json({ keys: apiKeys || [] })

  } catch (error) {
    console.error('Developer keys API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, scopes = ['generate'], rateLimit = 1000 } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      )
    }

    // Generate API key
    const fullKey = `cas_${randomBytes(32).toString('hex')}`
    const keyPrefix = `${fullKey.slice(0, 12)}...${fullKey.slice(-8)}`

    // Insert into database
    const { data, error } = await supabase
      .from('developer_api_keys')
      .insert({
        user_id: user.id,
        name: name.trim(),
        api_key: fullKey, // In production, this should be hashed
        key_prefix: keyPrefix,
        scopes: scopes,
        rate_limit: rateLimit,
        is_active: true,
        usage_count: 0
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create API key' },
        { status: 500 }
      )
    }

    // Return the full key only once
    return NextResponse.json({
      key: data,
      apiKey: fullKey,
      message: 'API key created successfully. Save this key securely - you won\'t be able to see it again!'
    })

  } catch (error) {
    console.error('Create developer key error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const url = new URL(request.url)
    const keyId = url.searchParams.get('id')

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('developer_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'API key deleted successfully' })

  } catch (error) {
    console.error('Delete developer key error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
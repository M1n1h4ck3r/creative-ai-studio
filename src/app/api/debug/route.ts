import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Test connection
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Test api_keys table
    const { data: apiKeysData, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('*')
      .limit(1)
    
    // Test users table  
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    return NextResponse.json({
      status: 'Database connection test',
      user: user ? { id: user.id, email: user.email } : null,
      authError: authError?.message,
      tables: {
        api_keys: {
          accessible: !apiKeysError,
          error: apiKeysError?.message,
          count: apiKeysData?.length || 0
        },
        users: {
          accessible: !usersError,
          error: usersError?.message,
          count: usersData?.length || 0
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'Connection failed',
      error: error.message
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic connection
    const supabase = createClient()
    
    // Test authentication service
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
    }
    
    // Test database connection - use auth.users instead
    const { data: authUsers, error } = await supabase.auth.admin.listUsers()
    
    const connectionTest = {
      timestamp: new Date().toISOString(),
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
      supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
      session_status: sessionError ? 'error' : 'ok',
      session_error: sessionError?.message || null,
      database_status: error ? 'error' : 'ok',
      database_error: error?.message || null,
      current_session: session ? 'authenticated' : 'anonymous'
    }

    return NextResponse.json({
      success: true,
      connection: connectionTest
    })
  } catch (error: any) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
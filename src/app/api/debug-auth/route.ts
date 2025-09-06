import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🔍 Debug Auth - Environment Variables:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing')
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    
    console.log('🔍 Session check result:', { data: !!data, error })
    
    if (error) {
      console.error('🚨 Supabase connection error:', error)
      return NextResponse.json({
        status: 'error',
        message: error.message,
        details: error
      }, { status: 500 })
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection working',
      hasSession: !!data.session,
      user: data.session?.user ? {
        id: data.session.user.id,
        email: data.session.user.email
      } : null
    })
  } catch (error: any) {
    console.error('🚨 Debug Auth error:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Unknown error',
      stack: error.stack
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, fullName } = await request.json()
    const supabase = createClient()

    switch (action) {
      case 'signup': {
        const { data, error } = await supabase.auth.signUp({
          email: email || `test${Date.now()}@example.com`,
          password: password || 'testpass123',
          options: {
            data: {
              full_name: fullName || 'Test User'
            }
          }
        })

        if (error) {
          return NextResponse.json({
            success: false,
            error: error.message,
            action: 'signup'
          })
        }

        return NextResponse.json({
          success: true,
          action: 'signup',
          user_id: data.user?.id,
          email: data.user?.email,
          confirmed: !!data.session,
          message: data.session ? 'User created and logged in' : 'User created, confirmation required'
        })
      }

      case 'signin': {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          return NextResponse.json({
            success: false,
            error: error.message,
            action: 'signin'
          })
        }

        return NextResponse.json({
          success: true,
          action: 'signin',
          user_id: data.user?.id,
          email: data.user?.email,
          session_id: data.session?.access_token?.substring(0, 20) + '...',
          message: 'Login successful'
        })
      }

      case 'check_session': {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        return NextResponse.json({
          success: !error,
          action: 'check_session',
          user_id: user?.id,
          email: user?.email,
          error: error?.message
        })
      }

      default: {
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: signup, signin, or check_session'
        }, { status: 400 })
      }
    }

  } catch (error: any) {
    console.error('Auth test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Auth test endpoint',
    usage: {
      method: 'POST',
      body: {
        action: 'signup | signin | check_session',
        email: 'optional for signup/required for signin',
        password: 'optional for signup/required for signin', 
        fullName: 'optional for signup'
      }
    }
  })
}
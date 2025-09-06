import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Use server client with service role for admin user creation
    const supabase = createServerClient()
    
    // Create user using admin method
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName || '',
      },
      email_confirm: true, // Auto-confirm email for admin-created users
    })

    if (error) {
      console.error('Signup error:', error)
      return NextResponse.json(
        { 
          error: error.message,
          details: error
        },
        { status: 400 }
      )
    }

    // After creating user, sign them in to get session
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      // User was created but couldn't sign in automatically
      return NextResponse.json({
        user: data.user,
        session: null,
        message: 'Account created successfully! Please sign in.',
        autoSignInFailed: true
      })
    }

    return NextResponse.json({
      user: sessionData.user,
      session: sessionData.session,
      message: 'Account created successfully!'
    })

  } catch (error: any) {
    console.error('Unexpected signup error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Use route handler client which automatically handles cookies
    const supabase = createRouteHandlerClient({ cookies })

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Signin error:', error)
      return NextResponse.json(
        {
          error: error.message,
          details: error
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
      message: 'Login successful!'
    })

  } catch (error: any) {
    console.error('Unexpected signin error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
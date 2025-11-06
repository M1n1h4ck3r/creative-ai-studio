import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get the origin from the request
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUrl = `${origin}/auth/reset-password`

    console.log('Reset password request:', { email, redirectUrl })

    // Use regular client for password reset
    const supabase = createClient()

    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error('Reset password error:', error)
      return NextResponse.json(
        {
          error: error.message,
          details: error
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      data,
      message: 'Password reset email sent successfully!'
    })

  } catch (error: any) {
    console.error('Unexpected reset password error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}

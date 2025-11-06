import { createClient } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  loading: boolean
}

export class AuthService {
  private getSupabase() {
    return createClient()
  }

  // Sign up with email and password - now uses API endpoint
  async signUp(email: string, password: string, fullName?: string) {
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // Ensure we're in browser context
    if (typeof window === 'undefined') {
      throw new Error('Sign up must be called from the browser')
    }

    // Build absolute URL
    const origin = window.location?.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url = `${origin}/api/auth/signup`

    console.log('Signup URL:', url)

    // Use our API endpoint which handles admin user creation properly
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
        fullName: fullName?.trim() || ''
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create account')
    }

    return result
  }

  // Sign in with email and password - now uses API endpoint
  async signIn(email: string, password: string) {
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // Ensure we're in browser context
    if (typeof window === 'undefined') {
      throw new Error('Sign in must be called from the browser')
    }

    // Build absolute URL
    const origin = window.location?.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url = `${origin}/api/auth/signin`

    console.log('Signin URL:', url)

    // Use our API endpoint for consistency
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        password
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to sign in')
    }

    return result
  }

  // Sign in with Google OAuth
  async signInWithGoogle(redirectTo?: string) {
    // Ensure we're in browser context
    if (typeof window === 'undefined') {
      throw new Error('Google sign-in must be called from the browser')
    }

    // Get the origin safely
    const origin = window.location?.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Validate the origin
    if (!origin || origin === 'undefined') {
      throw new Error('Unable to determine application URL for OAuth redirect')
    }

    const callbackUrl = redirectTo || `${origin}/auth/callback`

    const supabase = this.getSupabase()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) throw error
    return data
  }

  // Sign out
  async signOut() {
    const supabase = this.getSupabase()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Get current user
  async getCurrentUser() {
    const supabase = this.getSupabase()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  // Get current session
  async getSession() {
    const supabase = this.getSupabase()
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }

  // Reset password
  async resetPassword(email: string) {
    // Ensure we're in browser context
    if (typeof window === 'undefined') {
      throw new Error('Reset password must be called from the browser')
    }

    // Get the origin safely - use NEXT_PUBLIC_APP_URL as fallback
    const origin = window.location?.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Validate the origin is a valid URL
    if (!origin || origin === 'undefined') {
      throw new Error('Unable to determine application URL. Please check your environment configuration.')
    }

    const redirectUrl = `${origin}/auth/reset-password`

    console.log('Reset password - sending email with redirect:', redirectUrl)

    const supabase = this.getSupabase()
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error('Reset password error:', error)
      throw new Error(error.message || 'Erro ao enviar email de recuperação')
    }

    return data
  }

  // Update password
  async updatePassword(password: string) {
    const supabase = this.getSupabase()
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) throw error
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = this.getSupabase()
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Create singleton instance
export const authService = new AuthService()
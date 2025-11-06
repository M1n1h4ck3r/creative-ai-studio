import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Client-side Supabase client
export const createClient = () => {
  // Use browser-side environment variables
  const supabaseUrl = typeof window !== 'undefined'
    ? (window as any).ENV?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey = typeof window !== 'undefined'
    ? (window as any).ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Detailed logging for debugging
  if (typeof window !== 'undefined') {
    console.log('Supabase Client Config:', {
      url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
      key: supabaseAnonKey ? 'Present' : 'MISSING',
      env: process.env.NODE_ENV
    })
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client during build time
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      return null as any
    }
    const error = `Missing Supabase environment variables: URL=${!!supabaseUrl}, Key=${!!supabaseAnonKey}`
    console.error(error)
    throw new Error(error)
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch (e) {
    const error = `Invalid Supabase URL format: ${supabaseUrl}`
    console.error(error)
    throw new Error(error)
  }

  // Additional validation before creating client
  if (supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
    throw new Error('Supabase environment variables contain literal "undefined" string')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }) as any
}

// Server-side Supabase client
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    // Return a mock client during build time
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      return null as any
    }
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as any
}
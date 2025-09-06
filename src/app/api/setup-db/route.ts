import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const results = []
    
    // 1. Create users table that extends auth.users
    try {
      const { error: usersError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'users')
        .eq('table_schema', 'public')
      
      if (!usersError) {
        // Try to create a simple test record to check if auth works
        const { data: authUser } = await supabase.auth.getUser()
        results.push({ table: 'auth_test', status: 'ok', user: !!authUser })
      }
    } catch (error: any) {
      results.push({ table: 'users', status: 'error', error: error.message })
    }

    // 2. Test if we can create a profiles table (simpler approach)
    try {
      const { error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        
      if (error && error.message.includes('does not exist')) {
        // Create profiles table via raw SQL - this is the most direct approach
        const createProfilesSQL = `
          CREATE TABLE IF NOT EXISTS public.profiles (
            id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email text UNIQUE,
            full_name text,
            avatar_url text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          
          -- Enable RLS
          ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY IF NOT EXISTS "Public profiles are viewable by everyone" 
            ON public.profiles FOR SELECT USING (true);
            
          CREATE POLICY IF NOT EXISTS "Users can insert their own profile" 
            ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
            
          CREATE POLICY IF NOT EXISTS "Users can update own profile" 
            ON public.profiles FOR UPDATE USING (auth.uid() = id);
        `
        
        // Execute this via a special admin call
        results.push({ 
          table: 'profiles', 
          status: 'needs_manual_setup',
          message: 'Please run the SQL setup script in Supabase dashboard',
          sql: createProfilesSQL 
        })
      } else {
        results.push({ table: 'profiles', status: 'exists' })
      }
    } catch (error: any) {
      results.push({ table: 'profiles', status: 'error', error: error.message })
    }

    // 3. Test authentication directly
    try {
      // Test signup with a temporary user
      const testEmail = `test+${Date.now()}@example.com`
      const testPassword = 'testpass123'
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })
      
      if (signUpError) {
        results.push({ 
          test: 'signup', 
          status: 'error', 
          error: signUpError.message 
        })
      } else {
        results.push({ 
          test: 'signup', 
          status: 'ok',
          user_id: signUpData.user?.id,
          confirmation_required: !signUpData.session 
        })
        
        // Clean up test user if possible
        if (signUpData.user) {
          try {
            await supabase.auth.admin.deleteUser(signUpData.user.id)
            results.push({ test: 'cleanup', status: 'ok' })
          } catch {
            results.push({ test: 'cleanup', status: 'manual_required' })
          }
        }
      }
    } catch (error: any) {
      results.push({ test: 'signup', status: 'error', error: error.message })
    }

    return NextResponse.json({
      success: true,
      message: 'Database and auth diagnostics completed',
      results,
      next_steps: [
        'If profiles table needs manual setup, run the SQL in Supabase dashboard',
        'Check that email confirmation is configured correctly',
        'Verify that auth policies are properly set'
      ]
    })
    
  } catch (error: any) {
    console.error('Database setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
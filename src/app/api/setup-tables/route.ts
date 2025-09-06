import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const queries = [
      // Create profiles table
      `CREATE TABLE IF NOT EXISTS public.profiles (
        id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        email text UNIQUE,
        full_name text,
        avatar_url text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );`,
      
      // Enable RLS
      `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`,
      
      // Drop existing policies first
      `DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;`,
      `DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;`,
      `DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;`,
      
      // Create policies
      `CREATE POLICY "Public profiles are viewable by everyone" 
        ON public.profiles FOR SELECT USING (true);`,
      `CREATE POLICY "Users can insert their own profile" 
        ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);`,
      `CREATE POLICY "Users can update own profile" 
        ON public.profiles FOR UPDATE USING (auth.uid() = id);`,
      
      // Create api_keys table
      `CREATE TABLE IF NOT EXISTS public.api_keys (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        provider varchar(50) NOT NULL,
        encrypted_key text NOT NULL,
        key_name varchar(100),
        is_active boolean DEFAULT true,
        last_used_at timestamptz,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(user_id, provider, is_active)
      );`,
      
      `ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;`,
      
      `DROP POLICY IF EXISTS "Users can manage own API keys" ON public.api_keys;`,
      `CREATE POLICY "Users can manage own API keys" ON public.api_keys
        FOR ALL USING (auth.uid() = user_id);`,
        
      `CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);`,
      
      // Create generations table
      `CREATE TABLE IF NOT EXISTS public.generations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        provider varchar(50) NOT NULL,
        prompt text NOT NULL,
        negative_prompt text,
        model_used varchar(100),
        image_url text,
        thumbnail_url text,
        format varchar(20) DEFAULT '1:1',
        width integer,
        height integer,
        generation_time_ms integer,
        cost_credits integer DEFAULT 0,
        metadata jsonb,
        status varchar(20) DEFAULT 'pending',
        error_message text,
        is_favorite boolean DEFAULT false,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );`,
      
      `ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;`,
      
      `DROP POLICY IF EXISTS "Users can manage own generations" ON public.generations;`,
      `CREATE POLICY "Users can manage own generations" ON public.generations
        FOR ALL USING (auth.uid() = user_id);`,
        
      `CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);`,
      
      // Create trigger function for auto profile creation
      `CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, avatar_url)
        VALUES (
          new.id,
          new.email,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
          new.raw_user_meta_data->>'avatar_url'
        );
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;`,
      
      // Create trigger
      `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`,
      `CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();`
    ]
    
    const results = []
    
    for (const query of queries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { query })
        
        if (error) {
          // Try alternative method for queries that might not work with rpc
          console.log(`Query failed with rpc, attempting alternative: ${query.substring(0, 50)}...`)
          results.push({
            query: query.substring(0, 100) + '...',
            status: 'error', 
            error: error.message,
            method: 'rpc'
          })
        } else {
          results.push({
            query: query.substring(0, 100) + '...',
            status: 'success',
            method: 'rpc'
          })
        }
      } catch (err: any) {
        results.push({
          query: query.substring(0, 100) + '...',
          status: 'error',
          error: err.message,
          method: 'rpc_catch'
        })
      }
    }
    
    // Test if profiles table now exists
    try {
      const { error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        
      results.push({
        test: 'profiles_table_exists',
        status: testError ? 'error' : 'success',
        error: testError?.message
      })
    } catch (err: any) {
      results.push({
        test: 'profiles_table_exists',
        status: 'error',
        error: err.message
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Attempted to set up database tables',
      results,
      note: 'If queries failed, you may need to run them manually in Supabase SQL editor'
    })
    
  } catch (error: any) {
    console.error('Setup tables error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
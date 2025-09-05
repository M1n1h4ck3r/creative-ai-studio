import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Create users table
    const usersSQL = `
      CREATE TABLE IF NOT EXISTS public.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) UNIQUE NOT NULL,
        full_name varchar(255),
        avatar_url text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.users
        FOR ALL USING (auth.uid() = id);
    `
    
    const { error: usersError } = await supabase.rpc('exec', { sql: usersSQL } as any)
    if (usersError && !usersError.message.includes('already exists')) {
      console.log('Users table error:', usersError)
    }

    // Create api_keys table
    const apiKeysSQL = `
      CREATE TABLE IF NOT EXISTS public.api_keys (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        provider varchar(50) NOT NULL,
        encrypted_key text NOT NULL,
        key_name varchar(100),
        is_active boolean DEFAULT true,
        last_used_at timestamptz,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      
      ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can manage own API keys" ON public.api_keys
        FOR ALL USING (auth.uid() = user_id);
        
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
    `
    
    const { error: apiKeysError } = await supabase.rpc('exec', { sql: apiKeysSQL } as any)
    if (apiKeysError && !apiKeysError.message.includes('already exists')) {
      console.log('API keys table error:', apiKeysError)
    }

    // Create generations table
    const generationsSQL = `
      CREATE TABLE IF NOT EXISTS public.generations (
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
      );
      
      ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can manage own generations" ON public.generations
        FOR ALL USING (auth.uid() = user_id);
        
      CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
    `
    
    const { error: generationsError } = await supabase.rpc('exec', { sql: generationsSQL } as any)
    if (generationsError && !generationsError.message.includes('already exists')) {
      console.log('Generations table error:', generationsError)
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      errors: {
        users: usersError?.message || null,
        apiKeys: apiKeysError?.message || null,
        generations: generationsError?.message || null
      }
    })
    
  } catch (error: any) {
    console.error('Database setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
-- Creative AI Studio Database Schema
-- Image Generation focused tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email varchar(255) UNIQUE NOT NULL,
  full_name varchar(255),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- API Keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  provider varchar(50) NOT NULL,
  encrypted_key text NOT NULL,
  key_name varchar(100),
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider, is_active)
);

-- Generations table (main image generation records)
CREATE TABLE IF NOT EXISTS public.generations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
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

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own API keys" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own generations" ON public.generations
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON public.api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_status ON public.generations(status);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generations_updated_at BEFORE UPDATE ON public.generations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
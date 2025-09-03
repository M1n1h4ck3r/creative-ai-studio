-- Creative AI Studio - Database Setup
-- Execute this in Supabase SQL Editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- API Keys table (encrypted storage)
create table public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  provider text not null, -- 'gemini', 'openai', 'replicate', etc.
  encrypted_key text not null,
  key_name text, -- Optional friendly name
  is_active boolean default true,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one active key per provider per user
  unique(user_id, provider, is_active)
);

-- Generations table (track all AI generations)
create table public.generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  provider text not null,
  prompt text not null,
  negative_prompt text,
  model_used text,
  image_url text,
  thumbnail_url text,
  format text not null, -- '1:1', '9:16', '16:9', etc.
  width integer,
  height integer,
  generation_time_ms integer,
  cost_credits decimal(10,4),
  metadata jsonb, -- Additional generation parameters
  status text default 'pending', -- 'pending', 'completed', 'failed'
  error_message text,
  is_favorite boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for performance
create index idx_api_keys_user_provider on public.api_keys(user_id, provider);
create index idx_generations_user_created on public.generations(user_id, created_at desc);
create index idx_generations_status on public.generations(status);

-- Row Level Security (RLS) policies
alter table public.users enable row level security;
alter table public.api_keys enable row level security;
alter table public.generations enable row level security;

-- Users can only see/edit their own data
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- API Keys policies
create policy "Users can view own API keys" on public.api_keys
  for select using (auth.uid() = user_id);

create policy "Users can insert own API keys" on public.api_keys
  for insert with check (auth.uid() = user_id);

create policy "Users can update own API keys" on public.api_keys
  for update using (auth.uid() = user_id);

create policy "Users can delete own API keys" on public.api_keys
  for delete using (auth.uid() = user_id);

-- Generations policies
create policy "Users can view own generations" on public.generations
  for select using (auth.uid() = user_id);

create policy "Users can insert own generations" on public.generations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own generations" on public.generations
  for update using (auth.uid() = user_id);

create policy "Users can delete own generations" on public.generations
  for delete using (auth.uid() = user_id);

-- Function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers to all tables
create trigger update_users_updated_at before update on public.users
  for each row execute procedure public.update_updated_at_column();

create trigger update_api_keys_updated_at before update on public.api_keys
  for each row execute procedure public.update_updated_at_column();

create trigger update_generations_updated_at before update on public.generations
  for each row execute procedure public.update_updated_at_column();
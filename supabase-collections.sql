-- Collections Tables Setup
-- Run this script in the Supabase SQL Editor

-- 1. Create Collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  color varchar(50) DEFAULT 'bg-blue-500',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create Collection Items table (Images in collections)
CREATE TABLE IF NOT EXISTS public.collection_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  prompt text NOT NULL,
  provider varchar(50),
  aspect_ratio varchar(20),
  metadata jsonb,
  added_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, image_url) -- Prevent duplicate images in same collection
);

-- 3. Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Collections
CREATE POLICY "Users can view own collections" ON public.collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON public.collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON public.collections
  FOR DELETE USING (auth.uid() = user_id);

-- Collection Items
CREATE POLICY "Users can view own collection items" ON public.collection_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collection items" ON public.collection_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collection items" ON public.collection_items
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Triggers for updated_at
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Create Default "Favorites" Collection for new users
-- This function will be called when a new user is created (we can append to the previous trigger)
CREATE OR REPLACE FUNCTION public.create_default_collection()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.collections (user_id, name, description, color, is_default)
  VALUES (new.id, 'Favoritos', 'Suas imagens favoritas', 'bg-red-500', true);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for new users (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created_collection ON auth.users;
CREATE TRIGGER on_auth_user_created_collection
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_collection();

-- 7. Create default collection for EXISTING users (run once)
INSERT INTO public.collections (user_id, name, description, color, is_default)
SELECT id, 'Favoritos', 'Suas imagens favoritas', 'bg-red-500', true
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.collections c WHERE c.user_id = u.id AND c.is_default = true
);

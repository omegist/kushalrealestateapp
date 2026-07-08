-- Migrate favorites from device-based to user-based auth
ALTER TABLE public.favorites
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old device_id unique constraint and column
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_device_id_property_id_key;
ALTER TABLE public.favorites DROP COLUMN IF EXISTS device_id;

-- Add new unique constraint
ALTER TABLE public.favorites
  ADD CONSTRAINT favorites_user_id_property_id_key UNIQUE (user_id, property_id);

-- Drop old open policies
DROP POLICY IF EXISTS "Anyone can read favorites" ON public.favorites;
DROP POLICY IF EXISTS "Anyone can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Anyone can remove favorites" ON public.favorites;

-- Revoke anon access
REVOKE SELECT, INSERT, DELETE ON public.favorites FROM anon;

-- Grant authenticated access
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;

-- RLS: users can only access their own favorites
CREATE POLICY "Users read own favorites" ON public.favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own favorites" ON public.favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own favorites" ON public.favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

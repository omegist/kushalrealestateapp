ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS nearby_hospital text,
  ADD COLUMN IF NOT EXISTS nearby_school text,
  ADD COLUMN IF NOT EXISTS nearby_highway text,
  ADD COLUMN IF NOT EXISTS nearby_market text,
  ADD COLUMN IF NOT EXISTS virtual_tour_url text;
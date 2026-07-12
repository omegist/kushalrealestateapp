-- Adds a Sale vs Rent distinction to properties. Existing rows default to
-- 'sale' since that's what the app only supported until now.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'sale';

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_listing_type_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_listing_type_check CHECK (listing_type IN ('sale', 'rent'));

CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties (listing_type);
-- 1. Extend properties with marketplace fields
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS possession_status text,
  ADD COLUMN IF NOT EXISTS facing text,
  ADD COLUMN IF NOT EXISTS rera_number text,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS locality text,
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

-- 2. Favorites (device-based, no login required)
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, property_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO anon, authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read favorites" ON public.favorites FOR SELECT USING (true);
CREATE POLICY "Anyone can add favorites" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove favorites" ON public.favorites FOR DELETE USING (true);

-- 3. Reviews (public trust reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  comment text,
  review_type text NOT NULL DEFAULT 'property',
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO anon, authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved reviews" ON public.reviews FOR SELECT USING (approved = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can submit reviews" ON public.reviews FOR INSERT WITH CHECK (rating BETWEEN 1 AND 5);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete reviews" ON public.reviews FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 4. Analytics: property views
CREATE TABLE IF NOT EXISTS public.property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.property_views TO anon, authenticated;
GRANT SELECT ON public.property_views TO authenticated;
GRANT ALL ON public.property_views TO service_role;
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log a view" ON public.property_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read views" ON public.property_views FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 5. Analytics: search history
CREATE TABLE IF NOT EXISTS public.search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.search_history TO anon, authenticated;
GRANT SELECT ON public.search_history TO authenticated;
GRANT ALL ON public.search_history TO service_role;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log a search" ON public.search_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read searches" ON public.search_history FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 6. Generic analytics events (Firebase/Mixpanel mirror)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  payload jsonb,
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log an event" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read events" ON public.analytics_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 7. Atomic view increment helper
CREATE OR REPLACE FUNCTION public.increment_property_view(_property_id uuid, _device_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.property_views (property_id, device_id) VALUES (_property_id, _device_id);
  UPDATE public.properties SET views_count = views_count + 1 WHERE id = _property_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid, text) TO anon, authenticated;
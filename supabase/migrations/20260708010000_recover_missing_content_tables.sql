-- =====================================================================
-- RECOVERY MIGRATION: creates property_categories, banners, team_members
--
-- These three tables were defined in migration
-- 20260628101811_..._..sql, but that file was marked as "already applied"
-- via `supabase migration repair` without ever actually running (repair
-- only edits history bookkeeping, it doesn't execute SQL). As a result
-- these tables were never created on the remote database, which is why
-- banners/categories/team never showed up in the app after switching to
-- a single Supabase project.
--
-- Uses IF NOT EXISTS everywhere so it's safe to run even if some of these
-- partially exist already.
-- =====================================================================

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS public.property_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_categories TO anon, authenticated;
GRANT ALL ON public.property_categories TO service_role;
ALTER TABLE public.property_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are public" ON public.property_categories;
CREATE POLICY "Categories are public" ON public.property_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage categories" ON public.property_categories;
CREATE POLICY "Admins manage categories" ON public.property_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ BANNERS ============
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  subtitle text,
  image_url text NOT NULL,
  cta_label text,
  link_to text,
  sort_order int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Banners are public" ON public.banners;
CREATE POLICY "Banners are public" ON public.banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ TEAM MEMBERS ============
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  designation text,
  experience text,
  phone text,
  whatsapp text,
  email text,
  photo_url text,
  is_founder boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.team_members TO anon, authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team members are public" ON public.team_members;
CREATE POLICY "Team members are public" ON public.team_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage team" ON public.team_members;
CREATE POLICY "Admins manage team" ON public.team_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ SEED DATA (only inserts if the tables are currently empty) ============
INSERT INTO public.property_categories (name, slug, description, icon, sort_order)
SELECT * FROM (VALUES
  ('Residential', 'residential', 'Flats, Apartments & Villas', 'Home', 1),
  ('Commercial', 'commercial', 'Shops, Offices & Spaces', 'Building2', 2),
  ('Plots', 'plots', 'Open Plots & Investment Land', 'LandPlot', 3),
  ('Luxury Homes', 'luxury', 'Premium luxury residences', 'Crown', 4)
) AS v(name, slug, description, icon, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.property_categories);

INSERT INTO public.banners (title, subtitle, image_url, cta_label, link_to, sort_order, enabled)
SELECT * FROM (VALUES
  ('Luxury 2 BHK Apartments in Thane', 'Premium homes near Highland Park, Dhokali', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80', 'Explore Now', '/properties', 1, true),
  ('Premium Investment Opportunities', 'Verified plots with high growth potential', 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1600&q=80', 'View Plots', '/properties?category=plots', 2, true),
  ('Commercial Spaces in Prime Locations', 'Shops & offices ready for your business', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80', 'Browse', '/properties?category=commercial', 3, true)
) AS v(title, subtitle, image_url, cta_label, link_to, sort_order, enabled)
WHERE NOT EXISTS (SELECT 1 FROM public.banners);

INSERT INTO public.team_members (name, designation, experience, phone, whatsapp, email, is_founder, sort_order)
SELECT * FROM (VALUES
  ('Anil Chandrakant Patil', 'Founder & Real Estate Consultant', '15+ years in Thane real estate', '9029847968', '9029847968', 'anilpatil_30@yahoo.com', true, 0),
  ('Vaibhav Patil', 'Senior Executive', '6+ years experience', '9970548582', '9970548582', null, false, 1),
  ('Akshata Ghanekar', 'Senior Executive', '5+ years experience', '9326313320', '9326313320', null, false, 2),
  ('Ganesh Rathod', 'Junior Executive', '2+ years experience', '8424872525', '8424872525', null, false, 3),
  ('Kushal More', 'Junior Executive', '2+ years experience', '9137201473', '9137201473', null, false, 4),
  ('Rohit Gadve', 'Junior Executive', '1+ years experience', '7021162127', '7021162127', null, false, 5)
) AS v(name, designation, experience, phone, whatsapp, email, is_founder, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.team_members);
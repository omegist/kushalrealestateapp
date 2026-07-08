-- =====================================================================
--  KUSHAL ENTERPRISES — COMPLETE FRESH DATABASE SETUP
--  Run this ONCE in your Supabase project's SQL Editor
--  (Project B: ukynbjerbttxmtwxhbwg).
--
--  It builds everything from scratch:
--    • roles + has_role() security helper
--    • all CORE app tables (properties, enquiries, reviews, favorites …)
--    • favorites as USER-BASED from the start (fixes the user_id error)
--    • AUTO-ADMIN: the first 5 users to sign up become admins
--      automatically — no "grant access" step, all 5 are equal.
--    • list_admins() reader for the admin dashboard
--    • seed data (12 properties)
--
--  NOTE: banners, team_members and property_categories now live in the
--  separate CONTENT project (run supabase/setup-content-project.sql there).
--  This CORE script only DROPs those tables (to clean up any old copies) and
--  never recreates them here. The app reads content via the content client.
--
--  Safe to re-run: it drops and recreates the public objects it owns.
--  It does NOT touch auth.users except to attach the signup trigger.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. CLEAN SLATE (public schema only)
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_admin() CASCADE;
DROP FUNCTION IF EXISTS public.list_admins() CASCADE;
DROP FUNCTION IF EXISTS public.increment_property_view(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.search_history CASCADE;
DROP TABLE IF EXISTS public.property_views CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.enquiries CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.property_images CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.property_categories CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE  IF EXISTS public.app_role CASCADE;

-- ---------------------------------------------------------------------
-- 1. ROLES
-- ---------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 2. AUTO-ADMIN — first 5 signups become admins automatically
-- ---------------------------------------------------------------------
-- Runs as the table owner (SECURITY DEFINER) so it can INSERT into
-- user_roles despite RLS. It grants 'admin' only while fewer than 5
-- admins exist, so the first 5 accounts to sign up are the 5 admins.
-- Every one of them has full, equal access — there is no "first admin
-- who grants the others".
CREATE OR REPLACE FUNCTION public.handle_new_user_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.user_roles WHERE role = 'admin') < 5 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin();

-- Reader for the dashboard: returns the current admins (admins only).
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN;  -- non-admins get nothing
  END IF;
  RETURN QUERY
    SELECT ur.user_id, u.email::text, ur.created_at
    FROM public.user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    WHERE ur.role = 'admin'
    ORDER BY ur.created_at;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.list_admins() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3. updated_at helper
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

-- ---------------------------------------------------------------------
-- 4. CATEGORIES → moved to the CONTENT project (see setup-content-project.sql).
--    Dropped above; not created here.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 5. PROPERTIES (with marketplace fields included from the start)
-- ---------------------------------------------------------------------
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category_slug text NOT NULL DEFAULT 'residential',
  property_type text,
  location text NOT NULL,
  city text DEFAULT 'Thane',
  price_label text,
  price_value numeric,
  negotiable boolean NOT NULL DEFAULT false,
  bedrooms text,
  bathrooms int,
  builtup_area text,
  carpet_area text,
  floor_info text,
  construction_age text,
  amenities text[] NOT NULL DEFAULT '{}',
  features text[] NOT NULL DEFAULT '{}',
  contact_name text,
  contact_phone text,
  contact_phone_alt text,
  map_lat numeric,
  map_lng numeric,
  cover_image text,
  featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'available',
  possession_status text,
  facing text,
  rera_number text,
  verified boolean NOT NULL DEFAULT true,
  video_url text,
  locality text,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Properties are public" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Admins manage properties" ON public.properties FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 6. PROPERTY IMAGES
-- ---------------------------------------------------------------------
CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_images TO anon, authenticated;
GRANT ALL ON public.property_images TO service_role;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Property images are public" ON public.property_images FOR SELECT USING (true);
CREATE POLICY "Admins manage property images" ON public.property_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 7. BANNERS → moved to the CONTENT project (see setup-content-project.sql).
--    Dropped above; not created here.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 8. TEAM MEMBERS → moved to the CONTENT project (see setup-content-project.sql).
--    Dropped above; not created here.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 9. ENQUIRIES
-- ---------------------------------------------------------------------
CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  property_title text,
  message text,
  budget text,
  preferred_location text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.enquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit enquiry" ON public.enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view enquiries" ON public.enquiries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update enquiries" ON public.enquiries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete enquiries" ON public.enquiries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 10. FAVORITES — USER-BASED (fixes "Could not find the 'user_id' column")
-- ---------------------------------------------------------------------
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own favorites" ON public.favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own favorites" ON public.favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favorites" ON public.favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 11. REVIEWS
-- ---------------------------------------------------------------------
CREATE TABLE public.reviews (
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
CREATE POLICY "Anyone can read approved reviews" ON public.reviews FOR SELECT
  USING (approved = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can submit reviews" ON public.reviews FOR INSERT WITH CHECK (rating BETWEEN 1 AND 5);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete reviews" ON public.reviews FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 12. ANALYTICS (views, searches, events) + view increment RPC
-- ---------------------------------------------------------------------
CREATE TABLE public.property_views (
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

CREATE TABLE public.search_history (
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

CREATE TABLE public.analytics_events (
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

CREATE OR REPLACE FUNCTION public.increment_property_view(_property_id uuid, _device_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.property_views (property_id, device_id) VALUES (_property_id, _device_id);
  UPDATE public.properties SET views_count = views_count + 1 WHERE id = _property_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid, text) TO anon, authenticated;

-- =====================================================================
--  SEED DATA
-- =====================================================================

-- ---- Categories, Banners, Team ----
--   Seeded in the CONTENT project instead (setup-content-project.sql).
--   Not inserted here.

-- ---- Properties (12) ----
INSERT INTO public.properties (title, description, category_slug, property_type, location, city, price_label, price_value, negotiable, bedrooms, bathrooms, builtup_area, carpet_area, floor_info, construction_age, amenities, features, contact_name, contact_phone, contact_phone_alt, map_lat, map_lng, cover_image, featured, status) VALUES
('2 BHK Flat For Sale In Dhokali', 'A beautifully maintained, fully furnished 2 BHK flat in a prime location near Highland Park, Dhokali. Spacious layout with abundant natural light, premium fittings and a clear title. Ideal for families looking for comfort and connectivity.', 'residential', '2 BHK Flat', 'Near Highland Park, Dhokali, Balkum Naka, Thane', 'Thane', '₹1.45 Cr', 14500000, true, '2 BHK', 2, '1000 sqft', '652 sqft', '22nd Floor of 30', '3 Years Old', ARRAY['24 Hours Water Supply','Security','Lift Backup','Gym','Club House','Swimming Pool','Clear Title'], ARRAY['Prime Location','Fully Furnished','Clear Title Property'], 'Anil', '9029847968', '9326313320', 19.2183, 72.9781, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', true, 'available'),
('3 BHK Luxury Apartment in Manpada', 'Expansive 3 BHK luxury apartment with panoramic city views, modular kitchen and premium clubhouse access in a gated township.', 'luxury', '3 BHK Apartment', 'Manpada, Ghodbunder Road, Thane', 'Thane', '₹2.25 Cr', 22500000, true, '3 BHK', 3, '1450 sqft', '980 sqft', '14th Floor of 28', '2 Years Old', ARRAY['24 Hours Water Supply','Security','Lift Backup','Gym','Club House','Swimming Pool','Kids Play Area','Clear Title'], ARRAY['Gated Township','Premium Clubhouse','City View'], 'Anil', '9029847968', '9326313320', 19.2350, 72.9698, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', true, 'available'),
('1 BHK Affordable Flat in Kalwa', 'Compact and well-ventilated 1 BHK flat in Kalwa, close to the railway station with excellent connectivity. Great first home or investment.', 'residential', '1 BHK Flat', 'Kharigaon, Kalwa, Thane', 'Thane', '₹62 Lakh', 6200000, true, '1 BHK', 1, '560 sqft', '410 sqft', '5th Floor of 12', '4 Years Old', ARRAY['24 Hours Water Supply','Security','Lift Backup','Clear Title'], ARRAY['Near Railway Station','Affordable','Ready to Move'], 'Anil', '9029847968', '9326313320', 19.2010, 72.9905, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80', true, 'available'),
('Premium Office Space in Wagle Estate', 'Fully fitted commercial office space in the heart of Wagle Estate business district. Ideal for startups and corporates.', 'commercial', 'Office Space', 'Wagle Industrial Estate, Thane', 'Thane', '₹95 Lakh', 9500000, false, NULL, 2, '850 sqft', '700 sqft', '3rd Floor of 8', '5 Years Old', ARRAY['Security','Lift Backup','Power Backup','Parking','Clear Title'], ARRAY['Business District','Fitted Office','Ample Parking'], 'Anil', '9029847968', '9326313320', 19.1900, 72.9650, 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', true, 'available'),
('Retail Shop on Vithal Mandir Road', 'High-footfall retail shop on the busy Vithal Mandir Road, perfect for showrooms, food outlets and retail brands.', 'commercial', 'Retail Shop', 'Vithal Mandir Road, Kharigaon, Kalwa, Thane', 'Thane', '₹78 Lakh', 7800000, true, NULL, 1, '420 sqft', '380 sqft', 'Ground Floor', '6 Years Old', ARRAY['Security','High Footfall','Clear Title'], ARRAY['Main Road Facing','High Visibility','Ready Possession'], 'Anil', '9029847968', '9326313320', 19.2025, 72.9890, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80', false, 'available'),
('Open Investment Plot in Bhiwandi', 'NA-approved residential plot in a fast-developing corridor of Bhiwandi. Excellent long-term appreciation potential.', 'plots', 'Open Plot', 'Anjur Phata, Bhiwandi, Thane', 'Bhiwandi', '₹48 Lakh', 4800000, true, NULL, NULL, '2400 sqft', '2400 sqft', NULL, NULL, ARRAY['NA Approved','Clear Title','Road Access'], ARRAY['Investment Plot','High Growth Corridor','Gated Layout'], 'Anil', '9029847968', '9326313320', 19.2960, 73.0630, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', true, 'available'),
('4 BHK Sea-Facing Penthouse in Hiranandani', 'Ultra-luxurious 4 BHK penthouse with private terrace, sea-facing views and world-class amenities in Hiranandani Estate.', 'luxury', '4 BHK Penthouse', 'Hiranandani Estate, Ghodbunder Road, Thane', 'Thane', '₹5.75 Cr', 57500000, false, '4 BHK', 4, '3200 sqft', '2400 sqft', '30th Floor of 32', '1 Year Old', ARRAY['24 Hours Water Supply','Security','Lift Backup','Gym','Club House','Swimming Pool','Private Terrace','Concierge','Clear Title'], ARRAY['Sea Facing','Private Terrace','Ultra Luxury'], 'Anil', '9029847968', '9326313320', 19.2540, 72.9720, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', true, 'available'),
('2 BHK Ready Flat in Majiwada', 'Spacious 2 BHK in a premium tower at Majiwada Junction with seamless access to highways and malls.', 'residential', '2 BHK Flat', 'Majiwada, Thane West', 'Thane', '₹1.32 Cr', 13200000, true, '2 BHK', 2, '950 sqft', '640 sqft', '11th Floor of 22', '3 Years Old', ARRAY['24 Hours Water Supply','Security','Lift Backup','Gym','Club House','Clear Title'], ARRAY['Junction Location','Near Malls','Ready to Move'], 'Anil', '9029847968', '9326313320', 19.2167, 72.9760, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80', false, 'available'),
('Commercial Showroom in Thane West', 'Grand double-height showroom space on a main arterial road, suited for premium brands and automobile display.', 'commercial', 'Showroom', 'LBS Marg, Thane West', 'Thane', '₹3.10 Cr', 31000000, true, NULL, 2, '1800 sqft', '1600 sqft', 'Ground + Mezzanine', '4 Years Old', ARRAY['Security','Power Backup','Parking','Double Height','Clear Title'], ARRAY['Main Road','Double Height','Premium Frontage'], 'Anil', '9029847968', '9326313320', 19.1980, 72.9700, 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80', false, 'available'),
('Residential Plot in Shahapur', 'Scenic residential plot surrounded by greenery in Shahapur, ideal for a weekend home or farmhouse.', 'plots', 'Residential Plot', 'Shahapur, Thane District', 'Shahapur', '₹35 Lakh', 3500000, true, NULL, NULL, '3000 sqft', '3000 sqft', NULL, NULL, ARRAY['Clear Title','Road Access','Green Surroundings'], ARRAY['Weekend Home','Scenic Location','Investment'], 'Anil', '9029847968', '9326313320', 19.4460, 73.3300, 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?auto=format&fit=crop&w=1200&q=80', false, 'available'),
('3 BHK Villa in Kasarvadavali', 'Independent 3 BHK villa with private garden and parking in a serene gated villa community.', 'luxury', '3 BHK Villa', 'Kasarvadavali, Ghodbunder Road, Thane', 'Thane', '₹3.95 Cr', 39500000, true, '3 BHK', 4, '2600 sqft', '2100 sqft', 'G + 2 Independent', '2 Years Old', ARRAY['24 Hours Water Supply','Security','Private Garden','Parking','Club House','Clear Title'], ARRAY['Independent Villa','Private Garden','Gated Community'], 'Anil', '9029847968', '9326313320', 19.2700, 72.9750, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80', true, 'available'),
('1 BHK Investment Flat in Mumbra', 'Budget-friendly 1 BHK flat in Mumbra with good rental demand and connectivity to Thane and Navi Mumbai.', 'residential', '1 BHK Flat', 'Kausa, Mumbra, Thane', 'Thane', '₹42 Lakh', 4200000, true, '1 BHK', 1, '480 sqft', '360 sqft', '7th Floor of 14', '5 Years Old', ARRAY['24 Hours Water Supply','Security','Lift Backup','Clear Title'], ARRAY['High Rental Demand','Affordable','Good Connectivity'], 'Anil', '9029847968', '9326313320', 19.1880, 73.0230, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80', false, 'available');

-- =====================================================================
--  DONE. Next: create your 5 admin accounts by signing up through the
--  app's "Staff / Admin Login" screen. The first 5 signups become admins
--  automatically. Everyone after that is a normal user.
-- =====================================================================

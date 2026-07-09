-- =====================================================================
-- AUTO-ADMIN TRIGGER (moved from supabase/setup-fresh-database.sql)
--
-- This function/trigger existed only in a manually-run SQL script, never
-- in supabase/migrations/. That meant it was never applied to the real
-- database: every signup wrote a row to auth.users (which is why the
-- account "looked" like it saved), but no row was ever written to
-- public.user_roles, so no one was ever actually an admin. This migration
-- installs the trigger for real so it persists across restarts/deploys.
--
-- Safe to re-run: CREATE OR REPLACE / DROP IF EXISTS guard everything.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Grants 'admin' only while fewer than 5 admins exist, so the first 5
  -- accounts to sign up become the 5 admins. All 5 have equal access —
  -- there is no "first admin who grants the others".
  IF (SELECT count(*) FROM public.user_roles WHERE role = 'admin') < 5 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin();

-- Reader for the admin dashboard: returns current admins (admins only).
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN; -- non-admins get nothing
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
-- BACKFILL: if you already have real signups sitting in auth.users with
-- no admin role (because the trigger never existed until now), promote
-- the earliest up-to-5 of them to admin right now so you don't have to
-- re-signup from scratch.
-- ---------------------------------------------------------------------
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'admin'
WHERE ur.user_id IS NULL
  AND (SELECT count(*) FROM public.user_roles WHERE role = 'admin') < 5
ORDER BY u.created_at
LIMIT GREATEST(0, 5 - (SELECT count(*) FROM public.user_roles WHERE role = 'admin'))
ON CONFLICT (user_id, role) DO NOTHING;

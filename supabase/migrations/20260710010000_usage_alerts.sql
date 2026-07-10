-- Usage data is read only by the server-side usage monitor. One row per
-- service/month prevents a daily scheduled check from sending duplicate alerts.
CREATE TABLE IF NOT EXISTS public.usage_alerts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service text NOT NULL,
  period text NOT NULL,
  used_bytes bigint NOT NULL,
  threshold_bytes bigint NOT NULL,
  notified_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service, period)
);

ALTER TABLE public.usage_alerts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_platform_storage_usage()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT jsonb_build_object(
    'database_bytes', pg_database_size(current_database()),
    'storage_bytes', COALESCE(SUM((metadata->>'size')::bigint), 0)
  )
  FROM storage.objects;
$$;

REVOKE ALL ON FUNCTION public.get_platform_storage_usage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_storage_usage() TO service_role;

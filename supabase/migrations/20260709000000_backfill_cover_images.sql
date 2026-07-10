-- Backfill: any property with gallery images but no cover_image gets its
-- first (lowest sort_order) gallery image set as the cover, so it shows up
-- correctly in property cards immediately (no need to re-open/re-save it
-- in the admin panel).
UPDATE public.properties p
SET cover_image = sub.image_url
FROM (
  SELECT DISTINCT ON (property_id) property_id, image_url
  FROM public.property_images
  ORDER BY property_id, sort_order ASC
) sub
WHERE p.id = sub.property_id
  AND (p.cover_image IS NULL OR p.cover_image = '');
-- Existing listings predate agency selection. Keep them with Kushal Enterprises
-- and its WhatsApp number; new listings can choose either agency in the admin UI.
UPDATE public.properties
SET
  contact_name = 'Kushal Enterprises',
  contact_phone = '9326313320',
  contact_phone_alt = COALESCE(contact_phone_alt, '9029847968')
WHERE contact_name IS DISTINCT FROM 'Kushal Enterprises'
   OR contact_phone IS DISTINCT FROM '9326313320';

# Go-Live: 2-Project Supabase Split + Cloudflare R2 Uploads

This is the owner checklist to switch the app from a single Supabase project to the
new architecture. All the **code is already done** — this file only covers the
account/config steps that must be done by hand (they need your own Supabase &
Cloudflare accounts and secret keys).

## The new architecture

| Concern | Where it lives now |
|---|---|
| Auth, properties, property_images, enquiries, favorites, reviews, analytics, user_roles | **CORE** Supabase project (`ukynbjerbttxmtwxhbwg`) |
| banners, team_members, property_categories | **CONTENT** Supabase project (2nd project, you create it) |
| All uploaded media (property photos/videos, banners, team photos) | **Cloudflare R2** bucket |

Public visitors **read** content directly from the CONTENT project (anon key).
Admin **writes** to content go through the CORE `content-admin` Edge Function
(it verifies the admin, then writes with the CONTENT service-role key).
Uploads are presigned by the CORE `sign-upload` Edge Function and PUT straight to R2.

---

## Step 1 — Create the CONTENT Supabase project

1. In the Supabase dashboard, **New project** (any name, e.g. `kushal-content`).
2. Open its **SQL Editor** and run `supabase/setup-content-project.sql`.
   - This creates + seeds `banners`, `team_members`, `property_categories`.
3. From **Project Settings → API**, copy:
   - **Project URL** → goes into `.env` as `VITE_SUPABASE_CONTENT_URL`
   - **anon public key** → goes into `.env` as `VITE_SUPABASE_CONTENT_PUBLISHABLE_KEY`
   - **service_role key** → used in Step 4 as `CONTENT_SERVICE_ROLE_KEY` (secret — NOT in .env)

## Step 2 — (Re)run the CORE database script

Run `supabase/setup-fresh-database.sql` in the **CORE** project's SQL Editor.
It no longer creates banners/team/categories (those moved to CONTENT) and it
drops any old copies so the split is clean.

## Step 3 — Create the Cloudflare R2 bucket

1. Cloudflare dashboard → **R2** → **Create bucket** (e.g. `kushal-media`).
2. Enable public access for the bucket:
   - Either turn on the **r2.dev public URL**, or attach a **custom domain**
     (e.g. `media.yourdomain.com`).
   - Copy that public base URL (no trailing slash) → `.env` as `VITE_R2_PUBLIC_URL`.
3. Create an **R2 API token** (S3-compatible) with **Object Read & Write** on this
   bucket. Note down:
   - **Account ID** → `R2_ACCOUNT_ID`
   - Bucket name → `R2_BUCKET`
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
4. Add a **CORS policy** on the bucket so the browser can PUT to it. Allow your
   site origin(s), method `PUT`, and header `content-type`:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://YOUR-SITE-DOMAIN"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["content-type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

## Step 4 — Set the Edge Function secrets (on the CORE project)

The functions run on CORE. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
injected automatically — do **not** set those. Set the other six:

```bash
supabase link --project-ref ukynbjerbttxmtwxhbwg

supabase secrets set \
  R2_ACCOUNT_ID="..." \
  R2_BUCKET="kushal-media" \
  R2_ACCESS_KEY_ID="..." \
  R2_SECRET_ACCESS_KEY="..." \
  CONTENT_SUPABASE_URL="https://<content-ref>.supabase.co" \
  CONTENT_SERVICE_ROLE_KEY="<content project service_role key>"
```

## Step 5 — Deploy the two Edge Functions

```bash
supabase functions deploy sign-upload
supabase functions deploy content-admin
```

## Step 6 — Fill in `.env`

Replace the three placeholders in `.env`:

```
VITE_SUPABASE_CONTENT_URL="https://<content-ref>.supabase.co"
VITE_SUPABASE_CONTENT_PUBLISHABLE_KEY="<content anon key>"
VITE_R2_PUBLIC_URL="https://<your-r2-public-base>"   # no trailing slash
```

Then restart the dev server (Vite only reads env at startup):

```bash
npm run dev
```

## Step 7 — Verify

- [ ] Home page shows banners, categories, and the team section (reads from CONTENT).
- [ ] Sign in as an admin. Add/edit a **banner** and a **team member** → saves
      (this exercises the `content-admin` function + CONTENT service-role write).
- [ ] Upload an image in the Properties/Banners/Team admin → it uploads and the
      preview shows a `VITE_R2_PUBLIC_URL/...` link (this exercises `sign-upload` + R2).
- [ ] Open the R2 bucket and confirm the object exists under its folder
      (`properties/`, `banners/`, `team/`, `videos/`).

### If something fails
- **"R2 is not configured yet"** → `VITE_R2_PUBLIC_URL` still a `PASTE_...`
  placeholder, or dev server not restarted after editing `.env`.
- **Upload 403 / CORS error** → bucket CORS (Step 3.4) missing your origin, or the
  R2 API token lacks write on the bucket.
- **Banner/team save "Admin access required"** → you're not signed in as one of the
  first-5 admin accounts on the CORE project.
- **Banner/team save "R2 is not configured on the server" / CONTENT errors** →
  a Step-4 secret is missing or wrong; re-set and redeploy the function.

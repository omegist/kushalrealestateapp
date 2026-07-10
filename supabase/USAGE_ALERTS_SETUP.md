# Storage usage email alerts

The `usage-alerts` Edge Function checks the three limits once per day and emails
`omegist.dev@gmail.com` once per calendar month after each threshold is reached:

| Service | Free allowance | Alert threshold |
| --- | ---: | ---: |
| Supabase database | 500 MB | 430 MB |
| Supabase Storage | 1 GB | 900 MB |
| Cloudflare R2 | 10 GB-month | 9 GB |

## Deploy

1. Apply the migrations, including `20260710010000_usage_alerts.sql`.
2. Create a Resend API key and verify the sender domain used in `RESEND_FROM`.
3. Create a Cloudflare API token with account analytics read access. The function
   uses R2's `r2StorageAdaptiveGroups` metric; an R2 S3 upload key cannot query
   analytics.
4. Generate a long random `USAGE_ALERT_CRON_SECRET`, then configure server-only
   secrets (do not put these in the Vite `.env`):

```powershell
supabase secrets set RESEND_API_KEY="re_..." RESEND_FROM="Kushal Estates <alerts@your-verified-domain.com>" USAGE_ALERT_RECIPIENT="omegist.dev@gmail.com" CLOUDFLARE_API_TOKEN="..." USAGE_ALERT_CRON_SECRET="..."
supabase functions deploy usage-alerts --no-verify-jwt
```

`R2_ACCOUNT_ID`, `R2_BUCKET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`
are already server-side values used by this project.

## Schedule daily execution

In the Supabase SQL editor, replace the placeholder values, then run this once.
It keeps the Cron authorization secret in Supabase Vault rather than in the job
definition.

```sql
select vault.create_secret('Bearer REPLACE_WITH_USAGE_ALERT_CRON_SECRET', 'usage_alerts_authorization');

select cron.schedule(
  'usage-alerts-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://ukynbjerbttxmtwxhbwg.supabase.co/functions/v1/usage-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', (select decrypted_secret from vault.decrypted_secrets where name = 'usage_alerts_authorization')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Use the Function logs and `public.usage_alerts` to confirm each check and alert.
Delete a row from `usage_alerts` only when you intentionally need to re-send an
alert during the same month.

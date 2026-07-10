// Daily usage monitor. Deploy with --no-verify-jwt and invoke it only with
// `Authorization: Bearer $USAGE_ALERT_CRON_SECRET` from Supabase Cron.

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

type Usage = { service: string; usedBytes: number; limitBytes: number; thresholdBytes: number };

const GB = 1_000_000_000;
const MB = 1_000_000;
const databaseLimit = 500 * MB;
const supabaseStorageLimit = 1 * GB;
const r2Limit = 10 * GB;

async function supabaseUsage(url: string, key: string): Promise<Usage[]> {
  const response = await fetch(`${url}/rest/v1/rpc/get_platform_storage_usage`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!response.ok) throw new Error(`Supabase usage query failed: ${await response.text()}`);
  const data = (await response.json()) as { database_bytes: number; storage_bytes: number };
  return [
    { service: "Supabase database", usedBytes: data.database_bytes, limitBytes: databaseLimit, thresholdBytes: 430 * MB },
    { service: "Supabase Storage", usedBytes: data.storage_bytes, limitBytes: supabaseStorageLimit, thresholdBytes: 900 * MB },
  ];
}

async function r2Usage(accountId: string, bucket: string, token: string): Promise<Usage> {
  const query = `query R2Storage($accountTag: string!, $bucketName: string!, $startDate: Time!, $endDate: Time!) {
    viewer { accounts(filter: { accountTag: $accountTag }) {
      r2StorageAdaptiveGroups(limit: 1, filter: { datetime_geq: $startDate, datetime_leq: $endDate, bucketName: $bucketName }, orderBy: [datetime_DESC]) {
        max { payloadSize } dimensions { datetime }
      }
    }}
  }`;
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { accountTag: accountId, bucketName: bucket, startDate, endDate } }),
  });
  if (!response.ok) throw new Error(`Cloudflare usage query failed: ${await response.text()}`);
  const result = await response.json();
  if (result.errors?.length) throw new Error(`Cloudflare usage query failed: ${result.errors[0].message}`);
  const group = result.data?.viewer?.accounts?.[0]?.r2StorageAdaptiveGroups?.[0];
  if (!group) throw new Error("Cloudflare has not returned an R2 storage metric yet");
  return { service: "Cloudflare R2", usedBytes: Number(group.max.payloadSize ?? 0), limitBytes: r2Limit, thresholdBytes: 9 * GB };
}

async function alreadyAlerted(url: string, key: string, service: string, period: string) {
  const response = await fetch(`${url}/rest/v1/usage_alerts?service=eq.${encodeURIComponent(service)}&period=eq.${period}&select=id`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) throw new Error(`Alert history query failed: ${await response.text()}`);
  return ((await response.json()) as unknown[]).length > 0;
}

async function saveAlert(url: string, key: string, usage: Usage, period: string) {
  const response = await fetch(`${url}/rest/v1/usage_alerts`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ service: usage.service, period, used_bytes: usage.usedBytes, threshold_bytes: usage.thresholdBytes }),
  });
  if (!response.ok) throw new Error(`Could not record sent alert: ${await response.text()}`);
}

async function sendEmail(apiKey: string, from: string, to: string, usage: Usage) {
  const used = (usage.usedBytes / GB).toFixed(2);
  const limit = (usage.limitBytes / GB).toFixed(2);
  const threshold = (usage.thresholdBytes / GB).toFixed(2);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "User-Agent": "kushal-estate-usage-monitor" },
    body: JSON.stringify({ from, to: [to], subject: `Storage alert: ${usage.service}`, text: `${usage.service} has reached ${used} GB of its ${limit} GB allowance. Your alert threshold is ${threshold} GB.` }),
  });
  if (!response.ok) throw new Error(`Resend send failed: ${await response.text()}`);
}

Deno.serve(async (request) => {
  const cronSecret = Deno.env.get("USAGE_ALERT_CRON_SECRET");
  if (!cronSecret || request.headers.get("Authorization") !== `Bearer ${cronSecret}`) return json({ error: "Unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const period = new Date().toISOString().slice(0, 7);
  const failures: string[] = [];
  const usages = await supabaseUsage(url, key);
  try { usages.push(await r2Usage(Deno.env.get("R2_ACCOUNT_ID")!, Deno.env.get("R2_BUCKET")!, Deno.env.get("CLOUDFLARE_API_TOKEN")!)); }
  catch (error) { failures.push(error instanceof Error ? error.message : "Cloudflare usage check failed"); }

  const notified: string[] = [];
  for (const usage of usages) {
    if (usage.usedBytes < usage.thresholdBytes || await alreadyAlerted(url, key, usage.service, period)) continue;
    await sendEmail(Deno.env.get("RESEND_API_KEY")!, Deno.env.get("RESEND_FROM")!, Deno.env.get("USAGE_ALERT_RECIPIENT") ?? "omegist.dev@gmail.com", usage);
    await saveAlert(url, key, usage, period);
    notified.push(usage.service);
  }
  return json({ notified, failures });
});

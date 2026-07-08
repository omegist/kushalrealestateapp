// Supabase Edge Function: sign-upload
// -----------------------------------------------------------------------------
// Admin-only. Returns a short-lived presigned Cloudflare R2 PUT URL so the
// browser can upload a file DIRECTLY to R2 (no file passes through this
// function — good for large videos). The caller must be a logged-in admin on
// the CORE project.
//
// Secrets required (set with `supabase secrets set ...`):
//   R2_ACCOUNT_ID          e.g. 0123abcd...  (Cloudflare account id)
//   R2_BUCKET              your bucket name
//   R2_ACCESS_KEY_ID       R2 S3 API token access key id
//   R2_SECRET_ACCESS_KEY   R2 S3 API token secret
// Auto-injected by Supabase (do NOT set these): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Deploy:  supabase functions deploy sign-upload
// -----------------------------------------------------------------------------
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Build a safe, unique object key under a folder (e.g. "properties", "banners").
function makeKey(folder: string, filename: string): string {
  const dot = filename.lastIndexOf(".");
  const ext = dot >= 0 ? filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const safeFolder = (folder || "uploads").replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "") || "uploads";
  const id = crypto.randomUUID();
  return ext ? `${safeFolder}/${id}.${ext}` : `${safeFolder}/${id}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    // 1) Authenticate the caller and confirm they are an admin.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Not authenticated" }, 401);

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Admin access required" }, 403);

    // 2) Read request payload.
    const { filename, folder } = await req.json().catch(() => ({}));
    if (!filename || typeof filename !== "string") {
      return json({ error: "filename is required" }, 400);
    }

    // 3) Presign an R2 PUT URL (valid ~10 minutes).
    const accountId = Deno.env.get("R2_ACCOUNT_ID");
    const bucket = Deno.env.get("R2_BUCKET");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      return json({ error: "R2 is not configured on the server" }, 500);
    }

    const key = makeKey(String(folder ?? "uploads"), filename);
    const endpoint =
      `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURIComponent(key).replace(/%2F/g, "/")}` +
      `?X-Amz-Expires=600`;

    const aws = new AwsClient({ accessKeyId, secretAccessKey, region: "auto", service: "s3" });
    const signed = await aws.sign(new Request(endpoint, { method: "PUT" }), {
      aws: { signQuery: true },
    });

    return json({ uploadUrl: signed.url, key });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});

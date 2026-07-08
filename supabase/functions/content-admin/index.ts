// Supabase Edge Function: content-admin
// -----------------------------------------------------------------------------
// Admin-only write proxy for the CONTENT project (the 2nd Supabase project).
// Login lives only on the CORE project, so the CONTENT project can't verify who
// is an admin. This function runs on CORE (verifies the admin), then writes to
// the CONTENT project using its service_role key (which bypasses RLS).
//
// Handles tables: banners, team_members  (categories are read-only in the app).
// Actions: insert | update | delete.
//
// Secrets required (set with `supabase secrets set ...`):
//   CONTENT_SUPABASE_URL         the 2nd project's URL
//   CONTENT_SERVICE_ROLE_KEY     the 2nd project's service_role key (secret!)
// Auto-injected by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (CORE project)
//
// Deploy:  supabase functions deploy content-admin
// -----------------------------------------------------------------------------
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const ALLOWED_TABLES = new Set(["banners", "team_members"]);
const ALLOWED_ACTIONS = new Set(["insert", "update", "delete"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    // 1) Authenticate the caller on the CORE project and confirm admin.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Not authenticated" }, 401);

    const core = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: userData, error: userErr } = await core.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Not authenticated" }, 401);

    const { data: roleRow } = await core
      .from("user_roles")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Admin access required" }, 403);

    // 2) Validate the request.
    const { table, action, values, id } = await req.json().catch(() => ({}));
    if (!ALLOWED_TABLES.has(table)) return json({ error: "Invalid table" }, 400);
    if (!ALLOWED_ACTIONS.has(action)) return json({ error: "Invalid action" }, 400);

    // 3) Perform the write on the CONTENT project with its service role key.
    const content = createClient(
      Deno.env.get("CONTENT_SUPABASE_URL")!,
      Deno.env.get("CONTENT_SERVICE_ROLE_KEY")!,
    );

    if (action === "insert") {
      const { data, error } = await content.from(table).insert(values).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }
    if (action === "update") {
      if (!id) return json({ error: "id is required for update" }, 400);
      const { data, error } = await content.from(table).update(values).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }
    // delete
    if (!id) return json({ error: "id is required for delete" }, 400);
    const { error } = await content.from(table).delete().eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});

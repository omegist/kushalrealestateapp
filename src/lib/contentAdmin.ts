import { supabase } from "@/integrations/supabase/client";

// Client helper for admin writes to the CONTENT project (banners, team_members).
// Login lives on the CORE project, so writes are proxied through the
// `content-admin` Edge Function, which verifies the admin then writes to the
// CONTENT project with its service_role key. See supabase/functions/content-admin.

type ContentTable = "banners" | "team_members";
type ContentAction = "insert" | "update" | "delete";

export async function contentWrite(
  table: ContentTable,
  action: ContentAction,
  opts: { values?: Record<string, unknown>; id?: string },
): Promise<any> {
  const { data, error } = await supabase.functions.invoke("content-admin", {
    body: { table, action, values: opts.values, id: opts.id },
  });

  if (error) {
    // Surface the function's own error message from the response body if present.
    let message = error.message;
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) message = body.error;
    } catch {
      /* ignore parse failure */
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

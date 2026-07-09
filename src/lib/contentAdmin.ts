import { supabase } from "@/integrations/supabase/client";

// Admin writes to banners / team_members, now that both live in the single
// CORE Supabase project. RLS policies on those tables ("Admins manage
// banners" / "Admins manage team") already restrict writes to admins, so we
// can write directly with the logged-in user's session — no Edge Function
// proxy needed anymore.

type ContentTable = "banners" | "team_members";
type ContentAction = "insert" | "update" | "delete";

export async function contentWrite(
  table: ContentTable,
  action: ContentAction,
  opts: { values?: Record<string, unknown>; id?: string },
): Promise<any> {
  if (action === "insert") {
    const { data, error } = await supabase.from(table).insert(opts.values).select().single();
    if (error) throw new Error(error.message);
    return { data };
  }
  if (action === "update") {
    if (!opts.id) throw new Error("id is required for update");
    const { data, error } = await supabase.from(table).update(opts.values).eq("id", opts.id).select().single();
    if (error) throw new Error(error.message);
    return { data };
  }
  // delete
  if (!opts.id) throw new Error("id is required for delete");
  const { error } = await supabase.from(table).delete().eq("id", opts.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
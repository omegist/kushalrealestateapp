import { supabase } from "@/integrations/supabase/client";

export const MAX_ADMINS = 5;

/**
 * Returns whether the current signed-in user is an admin, plus the total admin count.
 *
 * Admin access is assigned automatically by a database trigger: the first 5
 * accounts to sign up become admins. There is no manual grant/claim step —
 * all 5 admins are equal.
 */
export async function getAdminStatus() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { count } = await supabase
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");

  const { data: mine } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  return { isAdmin: !!mine, adminCount: count ?? 0 };
}

export type AdminEntry = { user_id: string; email: string | null; created_at: string };

/**
 * Lists the current admins (read-only). Backed by the list_admins() RPC,
 * which returns rows only to callers who are themselves admins.
 */
export async function listAdmins(): Promise<AdminEntry[]> {
  const { data, error } = await supabase.rpc("list_admins");
  if (error) throw new Error(error.message);
  return data ?? [];
}

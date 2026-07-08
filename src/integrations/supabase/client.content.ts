// Client for the CONTENT Supabase project (the 2nd project).
// It serves the site's independent content tables ONLY:
//   banners, team_members, property_categories.
// Public reads use this anon key. Admin WRITES do NOT go through here —
// they are proxied by the CORE project's `content-admin` Edge Function
// using this project's service_role key. See client.ts for the CORE project
// (auth + properties + everything else).
import { createClient } from '@supabase/supabase-js';

function createContentClient() {
  const URL = import.meta.env.VITE_SUPABASE_CONTENT_URL || process.env.SUPABASE_CONTENT_URL;
  const KEY =
    import.meta.env.VITE_SUPABASE_CONTENT_PUBLISHABLE_KEY ||
    process.env.SUPABASE_CONTENT_PUBLISHABLE_KEY;

  if (!URL || !KEY) {
    const missing = [
      ...(!URL ? ['SUPABASE_CONTENT_URL'] : []),
      ...(!KEY ? ['SUPABASE_CONTENT_PUBLISHABLE_KEY'] : []),
    ];
    const message = `Missing CONTENT Supabase env var(s): ${missing.join(', ')}. Add them to .env.`;
    console.error(`[Supabase CONTENT] ${message}`);
    throw new Error(message);
  }

  // This project has no auth; a read-only anon client is all we need.
  return createClient(URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let _content: ReturnType<typeof createContentClient> | undefined;

// Import like: import { supabaseContent } from "@/integrations/supabase/client.content";
export const supabaseContent = new Proxy({} as ReturnType<typeof createContentClient>, {
  get(_, prop, receiver) {
    if (!_content) _content = createContentClient();
    return Reflect.get(_content, prop, receiver);
  },
});

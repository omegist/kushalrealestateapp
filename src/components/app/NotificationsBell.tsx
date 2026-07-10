import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Img } from "@/components/app/Img";
import { formatPrice } from "@/lib/brand";
import type { Property } from "@/lib/types";

/**
 * Properties added in the last 2 days show up here. Nothing needs to
 * "expire" on a timer — the query below always filters to
 * created_at >= (now - 2 days), so once a listing turns 3 days old it
 * simply stops matching and disappears from the list on its own the next
 * time this loads (which is every time the bell is opened).
 */
const RECENT_WINDOW_DAYS = 2;

function useRecentProperties() {
  return useQuery({
    queryKey: ["properties", "recent-notifications"],
    queryFn: async (): Promise<Property[]> => {
      const since = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "available")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Property[];
    },
    staleTime: 60_000,
  });
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { data: recent = [] } = useRecentProperties();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        aria-label="New properties"
      >
        <Bell className="h-4.5 w-4.5 text-foreground" />
        {recent.length > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-gradient-gold text-[8px] font-800 text-primary-foreground" />
        )}
      </button>

      {open && (
        <>
          {/* Tap outside to close */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 max-w-[85vw] overflow-hidden rounded-2xl border border-border bg-card shadow-luxury">
            <div className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-3">
              <Sparkles className="h-4 w-4 text-gold" />
              <p className="text-sm font-700 text-foreground">
                {recent.length > 0 ? "New properties just listed!" : "No new properties"}
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {recent.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Check back soon — new listings from the last 2 days show up here.
                </p>
              ) : (
                recent.map((p) => (
                  <Link
                    key={p.id}
                    to="/properties/$id"
                    params={{ id: p.id }}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0 hover:bg-secondary"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      <Img src={p.cover_image} alt={p.title} width={48} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-700 text-foreground">{p.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{p.location}</p>
                      <p className="text-xs font-800 text-gold">{formatPrice(p)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
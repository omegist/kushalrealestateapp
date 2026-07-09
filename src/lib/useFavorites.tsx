import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Favorites are shared app-wide state, not per-component state.
 *
 * This used to be a plain hook that every <PropertyCard> called
 * independently. Each card had its own private `favorites` array and its
 * own async fetch-on-mount. Favoriting on the Featured list, then opening
 * the Properties page before that page's own fetch resolved, meant its
 * local list was still empty -> clicking the same heart looked
 * "not favorited yet" -> tried to INSERT a row that already existed ->
 * 23505 duplicate key on favorites_user_id_property_id_key.
 *
 * Wrapping the app once in <FavoritesProvider> (see __root.tsx) and reading
 * from useFavorites() via context fixes this: there is exactly one
 * favorites list and one in-flight fetch for the whole app, so every heart
 * icon everywhere is always looking at the same state.
 */

type FavoritesContextValue = {
  favorites: string[];
  toggle: (propertyId: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  loading: boolean;
  user: User | null;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // Tracks ids with a write in flight so rapid double-clicks on the same
  // heart can't race two opposite requests against each other.
  const pending = useRef<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setFavorites([]); setLoading(false); return; }
    setLoading(true);
    // RLS restricts rows to the current user, so a plain select returns only theirs.
    supabase
      .from("favorites")
      .select("property_id")
      .then(({ data, error }) => {
        if (error) console.error("Failed to load favorites:", error);
        setFavorites((data ?? []).map((r) => r.property_id as string));
        setLoading(false);
      });
  }, [user]);

  const toggle = useCallback(async (propertyId: string) => {
    if (!user) {
      toast.error("Please log in to save properties");
      return;
    }
    if (pending.current.has(propertyId)) return; // ignore double-taps mid-request
    pending.current.add(propertyId);

    const exists = favorites.includes(propertyId);

    // Optimistic update
    setFavorites((prev) =>
      exists ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );

    const { error } = exists
      ? await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", propertyId)
      : await supabase.from("favorites").insert({ user_id: user.id, property_id: propertyId });

    pending.current.delete(propertyId);

    if (error) {
      // A duplicate-key error on insert just means it's already saved
      // server-side (e.g. stale local state) — treat as success rather than
      // surfacing a scary error to the user.
      if (!exists && error.code === "23505") {
        return;
      }
      // Revert on failure so the heart doesn't lie about what's saved
      setFavorites((prev) =>
        exists ? [...prev, propertyId] : prev.filter((id) => id !== propertyId)
      );
      console.error("Favorites write failed:", error);
      toast.error(error.message || "Couldn't update wishlist. Please try again.");
      return;
    }

    // Keep the Wishlist page's property list in sync
    queryClient.invalidateQueries({ queryKey: ["favorite-properties"] });
  }, [user, favorites, queryClient]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const value = useMemo(
    () => ({ favorites, toggle, isFavorite, loading, user }),
    [favorites, toggle, isFavorite, loading, user],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within <FavoritesProvider> (check __root.tsx)");
  }
  return ctx;
}

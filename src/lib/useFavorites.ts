import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useFavorites() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
      .then(({ data }) => {
        setFavorites((data ?? []).map((r) => r.property_id as string));
        setLoading(false);
      });
  }, [user]);

  const toggle = useCallback(async (propertyId: string) => {
    if (!user) {
      toast.error("Please log in to save properties");
      return;
    }
    const exists = favorites.includes(propertyId);

    // Optimistic update
    setFavorites((prev) =>
      exists ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );

    const { error } = exists
      ? await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", propertyId)
      : await supabase.from("favorites").insert({ user_id: user.id, property_id: propertyId });

    if (error) {
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

  return { favorites, toggle, isFavorite, loading, user };
}

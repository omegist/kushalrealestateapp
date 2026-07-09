import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Property, Banner, Category, TeamMember, PropertyImage, Review } from "@/lib/types";

export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Property[];
    },
  });
}

export function useFeaturedProperties() {
  return useQuery({
    queryKey: ["properties", "featured"],
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "available")
        .eq("featured", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Property[];
    },
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ["property", id],
    queryFn: async (): Promise<{ property: Property; images: PropertyImage[] }> => {
      const [{ data: property, error: pErr }, { data: images, error: iErr }] = await Promise.all([
        supabase.from("properties").select("*").eq("id", id).single(),
        supabase.from("property_images").select("*").eq("property_id", id).order("sort_order"),
      ]);
      if (pErr) throw pErr;
      if (iErr) throw iErr;
      return { property: property as Property, images: (images ?? []) as PropertyImage[] };
    },
    enabled: !!id,
  });
}

export function useBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async (): Promise<Banner[]> => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("enabled", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("property_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

export function useTeam() {
  return useQuery({
    queryKey: ["team"],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
  });
}

export function useFavoriteProperties() {
  return useQuery({
    queryKey: ["favorite-properties"],
    queryFn: async (): Promise<Property[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: favs, error: favError } = await supabase.from("favorites").select("property_id");
      if (favError) throw favError;
      const ids = (favs ?? []).map((f) => f.property_id);
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Property[];
    },
  });
}

export function useReviews(reviewType: string = "property", propertyId?: string) {
  return useQuery({
    queryKey: ["reviews", reviewType, propertyId],
    queryFn: async (): Promise<Review[]> => {
      let query = supabase
        .from("reviews")
        .select("*")
        .eq("approved", true)
        .eq("review_type", reviewType)
        .order("created_at", { ascending: false });
      if (propertyId) query = query.eq("property_id", propertyId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });
}
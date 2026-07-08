import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseContent } from "@/integrations/supabase/client.content";
import type { Property, Category, Banner, TeamMember, Enquiry, Review } from "./types";

export function useAdminProperties() {
  return useQuery({
    queryKey: ["admin", "properties"],
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Property[];
    },
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabaseContent.from("property_categories").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

export function useAdminEnquiries() {
  return useQuery({
    queryKey: ["admin", "enquiries"],
    queryFn: async (): Promise<Enquiry[]> => {
      const { data, error } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Enquiry[];
    },
  });
}

export function useAdminTeam() {
  return useQuery({
    queryKey: ["admin", "team"],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabaseContent.from("team_members").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
  });
}

export function useAdminReviews() {
  return useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });
}

export function useAdminBanners() {
  return useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async (): Promise<Banner[]> => {
      const { data, error } = await supabaseContent.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });
}

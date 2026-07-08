export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          device_id: string | null
          event_name: string
          id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          event_name: string
          id?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          event_name?: string
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          cta_label: string | null
          enabled: boolean
          id: string
          image_url: string
          link_to: string | null
          sort_order: number
          subtitle: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          enabled?: boolean
          id?: string
          image_url: string
          link_to?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          enabled?: boolean
          id?: string
          image_url?: string
          link_to?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          budget: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string
          preferred_location: string | null
          property_id: string | null
          property_title: string | null
          status: string
        }
        Insert: {
          budget?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone: string
          preferred_location?: string | null
          property_id?: string | null
          property_title?: string | null
          status?: string
        }
        Update: {
          budget?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string
          preferred_location?: string | null
          property_id?: string | null
          property_title?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          amenities: string[]
          bathrooms: number | null
          bedrooms: string | null
          builtup_area: string | null
          carpet_area: string | null
          category_slug: string
          city: string | null
          construction_age: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_phone_alt: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          facing: string | null
          featured: boolean
          features: string[]
          floor_info: string | null
          id: string
          locality: string | null
          location: string
          map_lat: number | null
          map_lng: number | null
          negotiable: boolean
          possession_status: string | null
          price_label: string | null
          price_value: number | null
          property_type: string | null
          rera_number: string | null
          status: string
          title: string
          updated_at: string
          verified: boolean
          video_url: string | null
          views_count: number
        }
        Insert: {
          amenities?: string[]
          bathrooms?: number | null
          bedrooms?: string | null
          builtup_area?: string | null
          carpet_area?: string | null
          category_slug?: string
          city?: string | null
          construction_age?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_phone_alt?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          facing?: string | null
          featured?: boolean
          features?: string[]
          floor_info?: string | null
          id?: string
          locality?: string | null
          location: string
          map_lat?: number | null
          map_lng?: number | null
          negotiable?: boolean
          possession_status?: string | null
          price_label?: string | null
          price_value?: number | null
          property_type?: string | null
          rera_number?: string | null
          status?: string
          title: string
          updated_at?: string
          verified?: boolean
          video_url?: string | null
          views_count?: number
        }
        Update: {
          amenities?: string[]
          bathrooms?: number | null
          bedrooms?: string | null
          builtup_area?: string | null
          carpet_area?: string | null
          category_slug?: string
          city?: string | null
          construction_age?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_phone_alt?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          facing?: string | null
          featured?: boolean
          features?: string[]
          floor_info?: string | null
          id?: string
          locality?: string | null
          location?: string
          map_lat?: number | null
          map_lng?: number | null
          negotiable?: boolean
          possession_status?: string | null
          price_label?: string | null
          price_value?: number | null
          property_type?: string | null
          rera_number?: string | null
          status?: string
          title?: string
          updated_at?: string
          verified?: boolean
          video_url?: string | null
          views_count?: number
        }
        Relationships: []
      }
      property_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      property_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          property_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          property_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          property_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_views: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          property_id: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          property_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved: boolean
          comment: string | null
          created_at: string
          id: string
          name: string
          property_id: string | null
          rating: number
          review_type: string
        }
        Insert: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          name: string
          property_id?: string | null
          rating?: number
          review_type?: string
        }
        Update: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          name?: string
          property_id?: string | null
          rating?: number
          review_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          query: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          query: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          query?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          designation: string | null
          email: string | null
          experience: string | null
          id: string
          is_founder: boolean
          name: string
          phone: string | null
          photo_url: string | null
          sort_order: number
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          designation?: string | null
          email?: string | null
          experience?: string | null
          id?: string
          is_founder?: boolean
          name: string
          phone?: string | null
          photo_url?: string | null
          sort_order?: number
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          designation?: string | null
          email?: string | null
          experience?: string | null
          id?: string
          is_founder?: boolean
          name?: string
          phone?: string | null
          photo_url?: string | null
          sort_order?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_favorite_property_ids: {
        Args: Record<string, never>
        Returns: { property_id: string }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_property_view: {
        Args: { _device_id?: string; _property_id: string }
        Returns: undefined
      }
      list_admins: {
        Args: Record<string, never>
        Returns: { user_id: string; email: string | null; created_at: string }[]
      }
      toggle_favorite: {
        Args: { _property_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const

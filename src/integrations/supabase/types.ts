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
      agents: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          referral_url: string
          sort_order: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          referral_url?: string
          sort_order?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          referral_url?: string
          sort_order?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      guide_steps: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          step_number: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          step_number?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          step_number?: number
          title?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          agent_links: Json
          batch: string
          category: string
          created_at: string
          display_order: number
          for_women: boolean
          id: string
          image_url: string | null
          images: string[]
          price: number
          price_cny: number
          promoted: boolean
          qc_images: string[]
          qc_url: string | null
          quality: string
          seller_id: string | null
          show_on_home: boolean
          sizes: string[]
          store_name: string
          store_url: string
          tiktok_url: string | null
          title: string
          verified: boolean
          views: number
        }
        Insert: {
          agent_links?: Json
          batch?: string
          category?: string
          created_at?: string
          display_order?: number
          for_women?: boolean
          id?: string
          image_url?: string | null
          images?: string[]
          price?: number
          price_cny?: number
          promoted?: boolean
          qc_images?: string[]
          qc_url?: string | null
          quality?: string
          seller_id?: string | null
          show_on_home?: boolean
          sizes?: string[]
          store_name?: string
          store_url?: string
          tiktok_url?: string | null
          title: string
          verified?: boolean
          views?: number
        }
        Update: {
          agent_links?: Json
          batch?: string
          category?: string
          created_at?: string
          display_order?: number
          for_women?: boolean
          id?: string
          image_url?: string | null
          images?: string[]
          price?: number
          price_cny?: number
          promoted?: boolean
          qc_images?: string[]
          qc_url?: string | null
          quality?: string
          seller_id?: string | null
          show_on_home?: boolean
          sizes?: string[]
          store_name?: string
          store_url?: string
          tiktok_url?: string | null
          title?: string
          verified?: boolean
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      promos: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          link_url: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          link_url?: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          link_url?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      sellers: {
        Row: {
          active: boolean
          banner_url: string | null
          created_at: string
          description: string
          external_url: string
          id: string
          link_mode: string
          logo_url: string | null
          name: string
          password_hash: string
          slug: string
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          banner_url?: string | null
          created_at?: string
          description?: string
          external_url?: string
          id?: string
          link_mode?: string
          logo_url?: string | null
          name: string
          password_hash?: string
          slug: string
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          banner_url?: string | null
          created_at?: string
          description?: string
          external_url?: string
          id?: string
          link_mode?: string
          logo_url?: string | null
          name?: string
          password_hash?: string
          slug?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value?: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      shipping_rates: {
        Row: {
          agent_name: string
          base_price: number
          coupon_code: string
          created_at: string
          discount_percent: number
          id: string
          line_name: string
          max_weight: number
          min_weight: number
          price_per_kg: number
          price_table: Json
          signup_url: string
          sort_order: number
        }
        Insert: {
          agent_name: string
          base_price?: number
          coupon_code?: string
          created_at?: string
          discount_percent?: number
          id?: string
          line_name?: string
          max_weight?: number
          min_weight?: number
          price_per_kg?: number
          price_table?: Json
          signup_url?: string
          sort_order?: number
        }
        Update: {
          agent_name?: string
          base_price?: number
          coupon_code?: string
          created_at?: string
          discount_percent?: number
          id?: string
          line_name?: string
          max_weight?: number
          min_weight?: number
          price_per_kg?: number
          price_table?: Json
          signup_url?: string
          sort_order?: number
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          icon: string
          id: string
          image_url: string | null
          label: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          image_url?: string | null
          label: string
          sort_order?: number
          url?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          image_url?: string | null
          label?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      sellers_public: {
        Row: {
          active: boolean | null
          banner_url: string | null
          created_at: string | null
          description: string | null
          external_url: string | null
          id: string | null
          link_mode: string | null
          logo_url: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          active?: boolean | null
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          id?: string | null
          link_mode?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          active?: boolean | null
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          id?: string | null
          link_mode?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

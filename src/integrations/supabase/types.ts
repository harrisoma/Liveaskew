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
      bee_conversations: {
        Row: {
          created_at: string
          id: string
          onboarding_completed_at: string | null
          pricing_abandoned_sent_at: string | null
          pricing_visited_at: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          onboarding_completed_at?: string | null
          pricing_abandoned_sent_at?: string | null
          pricing_visited_at?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          onboarding_completed_at?: string | null
          pricing_abandoned_sent_at?: string | null
          pricing_visited_at?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bee_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          latency_ms: number | null
          model: string | null
          role: string
          tokens_in: number | null
          tokens_out: number | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          model?: string | null
          role: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          model?: string | null
          role?: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bee_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "bee_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      bee_onboarding_responses: {
        Row: {
          choice: string | null
          created_at: string
          id: string
          note: string | null
          pillar: string
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          choice?: string | null
          created_at?: string
          id?: string
          note?: string | null
          pillar: string
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          choice?: string | null
          created_at?: string
          id?: string
          note?: string | null
          pillar?: string
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          id: string
          outfit_recommendation: string | null
          recommendation_error: string | null
          recommendation_status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          outfit_recommendation?: string | null
          recommendation_error?: string | null
          recommendation_status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          outfit_recommendation?: string | null
          recommendation_error?: string | null
          recommendation_status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      family_profiles: {
        Row: {
          aesthetic_territory: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          relationship: string
          selfie_photo_path: string | null
          sizes: Json
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          aesthetic_territory?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          relationship: string
          selfie_photo_path?: string | null
          sizes?: Json
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          aesthetic_territory?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          relationship?: string
          selfie_photo_path?: string | null
          sizes?: Json
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      look_items: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          id: string
          look_id: string
          name: string | null
          position: number | null
          recommended_fit: string | null
          role: string | null
          user_id: string
          wardrobe_item_id: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          id?: string
          look_id: string
          name?: string | null
          position?: number | null
          recommended_fit?: string | null
          role?: string | null
          user_id: string
          wardrobe_item_id?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          id?: string
          look_id?: string
          name?: string | null
          position?: number | null
          recommended_fit?: string | null
          role?: string | null
          user_id?: string
          wardrobe_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "look_items_look_id_fkey"
            columns: ["look_id"]
            isOneToOne: false
            referencedRelation: "looks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "look_items_wardrobe_item_id_fkey"
            columns: ["wardrobe_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
        ]
      }
      looks: {
        Row: {
          cover_photo_path: string | null
          created_at: string
          id: string
          name: string | null
          notes: string | null
          occasion: string | null
          season: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_photo_path?: string | null
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          occasion?: string | null
          season?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_photo_path?: string | null
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          occasion?: string | null
          season?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_styling_inquiries: {
        Row: {
          best_time_to_call: string | null
          budget_range: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          preferred_contact: string
          what_she_needs: string
        }
        Insert: {
          best_time_to_call?: string | null
          budget_range?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone: string
          preferred_contact: string
          what_she_needs: string
        }
        Update: {
          best_time_to_call?: string | null
          budget_range?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          preferred_contact?: string
          what_she_needs?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          body_shape: string | null
          budget_band: string | null
          client_code: string | null
          climate: string | null
          created_at: string
          dashboard_theme: string
          display_name: string | null
          email: string | null
          height_cm: number | null
          id: string
          location: string | null
          phone: string | null
          preferred_currency: string | null
          selfie_photo_path: string | null
          share_token: string | null
          size_bottom: string | null
          size_bra: string | null
          size_shoe: string | null
          size_top: string | null
          tier: string
          time_zone: string | null
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          body_shape?: string | null
          budget_band?: string | null
          client_code?: string | null
          climate?: string | null
          created_at?: string
          dashboard_theme?: string
          display_name?: string | null
          email?: string | null
          height_cm?: number | null
          id: string
          location?: string | null
          phone?: string | null
          preferred_currency?: string | null
          selfie_photo_path?: string | null
          share_token?: string | null
          size_bottom?: string | null
          size_bra?: string | null
          size_shoe?: string | null
          size_top?: string | null
          tier?: string
          time_zone?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          body_shape?: string | null
          budget_band?: string | null
          client_code?: string | null
          climate?: string | null
          created_at?: string
          dashboard_theme?: string
          display_name?: string | null
          email?: string | null
          height_cm?: number | null
          id?: string
          location?: string | null
          phone?: string | null
          preferred_currency?: string | null
          selfie_photo_path?: string | null
          share_token?: string | null
          size_bottom?: string | null
          size_bra?: string | null
          size_shoe?: string | null
          size_top?: string | null
          tier?: string
          time_zone?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_dispatches: {
        Row: {
          created_at: string
          day_key: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_key: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_key?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      style_plate_generations: {
        Row: {
          attempts: number
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          kind: string
          model: string | null
          prompt: string | null
          status: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          kind: string
          model?: string | null
          prompt?: string | null
          status: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          kind?: string
          model?: string | null
          prompt?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      style_profiles: {
        Row: {
          color_palette: Json | null
          color_season: string | null
          created_at: string
          id: string
          illustrations: Json | null
          lifestyle_mix: Json | null
          looks: Json | null
          north_star: string | null
          pillar_weights: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color_palette?: Json | null
          color_season?: string | null
          created_at?: string
          id?: string
          illustrations?: Json | null
          lifestyle_mix?: Json | null
          looks?: Json | null
          north_star?: string | null
          pillar_weights?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color_palette?: Json | null
          color_season?: string | null
          created_at?: string
          id?: string
          illustrations?: Json | null
          lifestyle_mix?: Json | null
          looks?: Json | null
          north_star?: string | null
          pillar_weights?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          dunning_attempts: number
          dunning_last_sent_at: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_ending_sent_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          dunning_attempts?: number
          dunning_last_sent_at?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_ending_sent_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          dunning_attempts?: number
          dunning_last_sent_at?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_ending_sent_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      trial_history: {
        Row: {
          created_at: string
          email: string
          environment: string
          id: string
          started_at: string
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          environment?: string
          id?: string
          started_at?: string
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          environment?: string
          id?: string
          started_at?: string
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_look_feedback: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          look_id: string | null
          profile_id: string | null
          status: string
          style_metadata: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          look_id?: string | null
          profile_id?: string | null
          status: string
          style_metadata?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          look_id?: string | null
          profile_id?: string | null
          status?: string
          style_metadata?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_look_feedback_look_id_fkey"
            columns: ["look_id"]
            isOneToOne: false
            referencedRelation: "looks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_look_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "family_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      wardrobe_items: {
        Row: {
          brand: string | null
          category: string
          color: string | null
          created_at: string
          id: string
          name: string | null
          notes: string | null
          pattern: string | null
          photo_path: string | null
          season: string | null
          subcategory: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          category: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          pattern?: string | null
          photo_path?: string | null
          season?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          pattern?: string | null
          photo_path?: string | null
          season?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      revoke_style_guide_share_token: { Args: never; Returns: undefined }
      rotate_style_guide_share_token: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

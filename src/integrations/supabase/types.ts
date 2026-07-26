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
          country: string | null
          created_at: string
          device: string | null
          duration_ms: number | null
          event_type: string
          id: number
          metadata: Json | null
          path: string | null
          referrer: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device?: string | null
          duration_ms?: number | null
          event_type: string
          id?: number
          metadata?: Json | null
          path?: string | null
          referrer?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device?: string | null
          duration_ms?: number | null
          event_type?: string
          id?: number
          metadata?: Json | null
          path?: string | null
          referrer?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      base_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          id: string
          member_id: string
          plan: Database["public"]["Enums"]["plan_type"]
          renews_at: string | null
          status: Database["public"]["Enums"]["sub_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          id?: string
          member_id: string
          plan?: Database["public"]["Enums"]["plan_type"]
          renews_at?: string | null
          status?: Database["public"]["Enums"]["sub_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          id?: string
          member_id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          renews_at?: string | null
          status?: Database["public"]["Enums"]["sub_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      early_access_signups: {
        Row: {
          created_at: string
          email: string
          feature: string
          id: string
          note: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          feature: string
          id?: string
          note?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          feature?: string
          id?: string
          note?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      earnings_ledger: {
        Row: {
          created_at: string
          gross_cents: number
          host_id: string
          host_share_cents: number
          id: string
          source: Database["public"]["Enums"]["earning_source"]
          split_pct_at_time: number
        }
        Insert: {
          created_at?: string
          gross_cents?: number
          host_id: string
          host_share_cents?: number
          id?: string
          source: Database["public"]["Enums"]["earning_source"]
          split_pct_at_time?: number
        }
        Update: {
          created_at?: string
          gross_cents?: number
          host_id?: string
          host_share_cents?: number
          id?: string
          source?: Database["public"]["Enums"]["earning_source"]
          split_pct_at_time?: number
        }
        Relationships: []
      }
      friends_lists: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          host_id: string
          id: string
          price_cents: number
          subscriber_count: number
          tier: Database["public"]["Enums"]["list_tier"]
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          host_id: string
          id?: string
          price_cents?: number
          subscriber_count?: number
          tier?: Database["public"]["Enums"]["list_tier"]
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          host_id?: string
          id?: string
          price_cents?: number
          subscriber_count?: number
          tier?: Database["public"]["Enums"]["list_tier"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gifts: {
        Row: {
          coin_value: number
          created_at: string
          gift_type: string
          id: string
          recipient_host_id: string
          sender_id: string
        }
        Insert: {
          coin_value: number
          created_at?: string
          gift_type: string
          id?: string
          recipient_host_id: string
          sender_id: string
        }
        Update: {
          coin_value?: number
          created_at?: string
          gift_type?: string
          id?: string
          recipient_host_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      host_invites: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          host_id: string
          id: string
          label: string | null
          max_uses: number | null
          uses: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          host_id: string
          id?: string
          label?: string | null
          max_uses?: number | null
          uses?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          host_id?: string
          id?: string
          label?: string | null
          max_uses?: number | null
          uses?: number
        }
        Relationships: []
      }
      host_payouts: {
        Row: {
          amount_cents: number
          created_at: string
          host_id: string
          id: string
          method: string
          notes: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          host_id: string
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          host_id?: string
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      host_rooms: {
        Row: {
          category: string | null
          city: string | null
          created_at: string
          description: string | null
          host_id: string
          id: string
          is_public: boolean
          lat: number | null
          lng: number | null
          name: string
          state: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          host_id: string
          id?: string
          is_public?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          host_id?: string
          id?: string
          is_public?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          created_at: string
          date_of_birth: string
          document_path: string
          document_type: string
          id: string
          legal_name: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_path: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          document_path: string
          document_type?: string
          id?: string
          legal_name: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          document_path?: string
          document_type?: string
          id?: string
          legal_name?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      list_memberships: {
        Row: {
          chat_access_until: string | null
          id: string
          list_id: string
          member_id: string
          price_cents_at_join: number
          renews_at: string | null
          started_at: string
          status: Database["public"]["Enums"]["membership_status"]
        }
        Insert: {
          chat_access_until?: string | null
          id?: string
          list_id: string
          member_id: string
          price_cents_at_join?: number
          renews_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["membership_status"]
        }
        Update: {
          chat_access_until?: string | null
          id?: string
          list_id?: string
          member_id?: string
          price_cents_at_join?: number
          renews_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["membership_status"]
        }
        Relationships: [
          {
            foreignKeyName: "list_memberships_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "friends_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          list_id: string | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          list_id?: string | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          list_id?: string | null
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "friends_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_type: string
          sort_order: number
          storage_path: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type: string
          sort_order?: number
          storage_path: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          sort_order?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          age_confirmed: boolean
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          display_name: string
          flipped_at: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          interests: string[]
          kyc_approved_at: string | null
          kyc_due_at: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          platform_tier: Database["public"]["Enums"]["platform_tier"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          age_confirmed?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          display_name?: string
          flipped_at?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id: string
          interests?: string[]
          kyc_approved_at?: string | null
          kyc_due_at?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          platform_tier?: Database["public"]["Enums"]["platform_tier"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          age_confirmed?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          display_name?: string
          flipped_at?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          interests?: string[]
          kyc_approved_at?: string | null
          kyc_due_at?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          platform_tier?: Database["public"]["Enums"]["platform_tier"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      promo_slides: {
        Row: {
          active: boolean
          created_at: string
          cta_link: string | null
          cta_text: string | null
          headline: string
          id: string
          image_url: string
          is_demo: boolean
          partner_name: string | null
          sort_order: number
          subtext: string | null
          usage_rights_confirmed: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          headline: string
          id?: string
          image_url: string
          is_demo?: boolean
          partner_name?: string | null
          sort_order?: number
          subtext?: string | null
          usage_rights_confirmed?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          headline?: string
          id?: string
          image_url?: string
          is_demo?: boolean
          partner_name?: string | null
          sort_order?: number
          subtext?: string | null
          usage_rights_confirmed?: boolean
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_role: Database["public"]["Enums"]["account_type"]
          referred_user_id: string
          referrer_host_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_role: Database["public"]["Enums"]["account_type"]
          referred_user_id: string
          referrer_host_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_role?: Database["public"]["Enums"]["account_type"]
          referred_user_id?: string
          referrer_host_id?: string
        }
        Relationships: []
      }
      room_members: {
        Row: {
          added_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "host_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          room_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          room_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "host_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_brain_runs: {
        Row: {
          captions_refreshed: number
          id: string
          items_scored: number
          note: string | null
          ran_at: string
          trigger: string
        }
        Insert: {
          captions_refreshed?: number
          id?: string
          items_scored?: number
          note?: string | null
          ran_at?: string
          trigger: string
        }
        Update: {
          captions_refreshed?: number
          id?: string
          items_scored?: number
          note?: string | null
          ran_at?: string
          trigger?: string
        }
        Relationships: []
      }
      showcase_brain_settings: {
        Row: {
          cadence_minutes: number
          enabled: boolean
          id: number
          last_run_at: string | null
          last_run_note: string | null
          reel_size: number
          refresh_caption_after_hours: number
          tone: string
          updated_at: string
        }
        Insert: {
          cadence_minutes?: number
          enabled?: boolean
          id?: number
          last_run_at?: string | null
          last_run_note?: string | null
          reel_size?: number
          refresh_caption_after_hours?: number
          tone?: string
          updated_at?: string
        }
        Update: {
          cadence_minutes?: number
          enabled?: boolean
          id?: number
          last_run_at?: string | null
          last_run_note?: string | null
          reel_size?: number
          refresh_caption_after_hours?: number
          tone?: string
          updated_at?: string
        }
        Relationships: []
      }
      showcase_media: {
        Row: {
          ai_caption_updated_at: string | null
          ai_score: number
          caption: string | null
          completes: number
          created_at: string
          dismisses: number
          id: string
          impressions: number
          is_active: boolean
          media_type: string
          original_caption: string | null
          sort_order: number
          storage_path: string
          updated_at: string
          uploader_id: string | null
        }
        Insert: {
          ai_caption_updated_at?: string | null
          ai_score?: number
          caption?: string | null
          completes?: number
          created_at?: string
          dismisses?: number
          id?: string
          impressions?: number
          is_active?: boolean
          media_type: string
          original_caption?: string | null
          sort_order?: number
          storage_path: string
          updated_at?: string
          uploader_id?: string | null
        }
        Update: {
          ai_caption_updated_at?: string | null
          ai_score?: number
          caption?: string | null
          completes?: number
          created_at?: string
          dismisses?: number
          id?: string
          impressions?: number
          is_active?: boolean
          media_type?: string
          original_caption?: string | null
          sort_order?: number
          storage_path?: string
          updated_at?: string
          uploader_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          host_id: string | null
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          host_id?: string | null
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          host_id?: string | null
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
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
      wallets: {
        Row: {
          coin_balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coin_balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coin_balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_id: string
          processed_at: string
          type: string
        }
        Insert: {
          event_id: string
          processed_at?: string
          type: string
        }
        Update: {
          event_id?: string
          processed_at?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_platform_metrics: { Args: { _since?: string }; Returns: Json }
      admin_review_kyc: {
        Args: { _approve: boolean; _notes?: string; _submission_id: string }
        Returns: Json
      }
      admin_top_hosts: {
        Args: { _limit?: number; _since?: string }
        Returns: {
          display_name: string
          gross_cents: number
          host_id: string
          host_share_cents: number
          platform_cents: number
          transactions: number
        }[]
      }
      credit_coins: {
        Args: { _coins: number; _user_id: string }
        Returns: undefined
      }
      friends_list_grace_end: {
        Args: { _host_id: string; _member_id: string }
        Returns: undefined
      }
      get_showcase_reel: {
        Args: { _limit?: number }
        Returns: {
          caption: string
          id: string
          media_type: string
          score: number
          storage_path: string
        }[]
      }
      grant_friends_list_access: {
        Args: { _host_id: string; _member_id: string; _price_cents: number }
        Returns: undefined
      }
      has_chat_access: {
        Args: { _host_id: string; _member_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      host_self_stats: { Args: { _since?: string }; Returns: Json }
      is_room_host: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_room_member: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      log_showcase_event: {
        Args: { _event: string; _id: string }
        Returns: undefined
      }
      my_kyc_state: { Args: never; Returns: Json }
      redeem_host_invite: { Args: { _code: string }; Returns: Json }
      send_coin_gift: {
        Args: { _coins: number; _host: string; _label: string; _sender: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      war_room_metrics: { Args: { _hours?: number }; Returns: Json }
    }
    Enums: {
      account_type: "host" | "member"
      app_role: "admin"
      earning_source: "list" | "gift" | "referral"
      gender: "female" | "male" | "nonbinary" | "other"
      kyc_status: "none" | "pending" | "approved" | "rejected"
      list_tier: "new" | "rising" | "popular" | "elite"
      membership_status: "trial" | "active" | "cancelled"
      plan_type: "weekly" | "monthly"
      platform_tier: "free" | "plus" | "vip"
      sub_status: "trial" | "active" | "cancelled" | "expired" | "trialing"
      verification_status: "pending" | "verified" | "rejected"
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
      account_type: ["host", "member"],
      app_role: ["admin"],
      earning_source: ["list", "gift", "referral"],
      gender: ["female", "male", "nonbinary", "other"],
      kyc_status: ["none", "pending", "approved", "rejected"],
      list_tier: ["new", "rising", "popular", "elite"],
      membership_status: ["trial", "active", "cancelled"],
      plan_type: ["weekly", "monthly"],
      platform_tier: ["free", "plus", "vip"],
      sub_status: ["trial", "active", "cancelled", "expired", "trialing"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const

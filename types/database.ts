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
      activity_feed: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_title: string | null
          entity_type: string
          event_type: string
          id: string
          is_public: boolean
          metadata: Json | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_title?: string | null
          entity_type: string
          event_type: string
          id?: string
          is_public?: boolean
          metadata?: Json | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_title?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          is_public?: boolean
          metadata?: Json | null
        }
        Relationships: []
      }
      affiliate_payouts: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          processed_at: string | null
          status: string
          stripe_payout_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          stripe_payout_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          stripe_payout_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          listing_id: string
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          listing_id: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          listing_id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event: string
          id: string
          properties: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event: string
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event?: string
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          allowed_domains: string[] | null
          allowed_ips: string[] | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          key_value: string
          last_used_at: string | null
          name: string
          permissions: string[] | null
          rate_limit: number | null
          restriction_type: string | null
          status: Database["public"]["Enums"]["api_key_status_enum"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_domains?: string[] | null
          allowed_ips?: string[] | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          key_value: string
          last_used_at?: string | null
          name: string
          permissions?: string[] | null
          rate_limit?: number | null
          restriction_type?: string | null
          status?: Database["public"]["Enums"]["api_key_status_enum"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_domains?: string[] | null
          allowed_ips?: string[] | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          key_value?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[] | null
          rate_limit?: number | null
          restriction_type?: string | null
          status?: Database["public"]["Enums"]["api_key_status_enum"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      api_logs: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          level: Database["public"]["Enums"]["log_level_enum"] | null
          message: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          level?: Database["public"]["Enums"]["log_level_enum"] | null
          message: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          level?: Database["public"]["Enums"]["log_level_enum"] | null
          message?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string | null
          latency_ms: number
          method: string
          status_code: number
          user_agent: string | null
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: string | null
          latency_ms: number
          method: string
          status_code: number
          user_agent?: string | null
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string | null
          latency_ms?: number
          method?: string
          status_code?: number
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          callback_url: string | null
          client_id: string
          client_secret: string | null
          client_secret_hash: string
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          scopes: string[] | null
          status: Database["public"]["Enums"]["application_status_enum"] | null
          updated_at: string | null
          user_id: string
          webhook_url: string | null
          website: string | null
        }
        Insert: {
          callback_url?: string | null
          client_id: string
          client_secret?: string | null
          client_secret_hash: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          scopes?: string[] | null
          status?: Database["public"]["Enums"]["application_status_enum"] | null
          updated_at?: string | null
          user_id: string
          webhook_url?: string | null
          website?: string | null
        }
        Update: {
          callback_url?: string | null
          client_id?: string
          client_secret?: string | null
          client_secret_hash?: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          scopes?: string[] | null
          status?: Database["public"]["Enums"]["application_status_enum"] | null
          updated_at?: string | null
          user_id?: string
          webhook_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      architect_background_jobs: {
        Row: {
          completed_at: string | null
          completed_files: Json | null
          created_at: string
          current_file: string | null
          current_step: string | null
          error: string | null
          failed_files: Json | null
          file_queue: Json | null
          id: string
          job_id: string
          payload: Json
          progress: number
          result: Json | null
          session_id: string | null
          started_at: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_files?: Json | null
          created_at?: string
          current_file?: string | null
          current_step?: string | null
          error?: string | null
          failed_files?: Json | null
          file_queue?: Json | null
          id?: string
          job_id: string
          payload: Json
          progress?: number
          result?: Json | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_files?: Json | null
          created_at?: string
          current_file?: string | null
          current_step?: string | null
          error?: string | null
          failed_files?: Json | null
          file_queue?: Json | null
          id?: string
          job_id?: string
          payload?: Json
          progress?: number
          result?: Json | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      architect_sessions: {
        Row: {
          completed_at: string | null
          confidence: number
          created_at: string
          file_count: number
          generated_files: Json | null
          id: string
          ip_address: string | null
          messages: Json
          phase: string
          session_name: string | null
          summary: Json | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          confidence?: number
          created_at?: string
          file_count?: number
          generated_files?: Json | null
          id?: string
          ip_address?: string | null
          messages?: Json
          phase?: string
          session_name?: string | null
          summary?: Json | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          confidence?: number
          created_at?: string
          file_count?: number
          generated_files?: Json | null
          id?: string
          ip_address?: string | null
          messages?: Json
          phase?: string
          session_name?: string | null
          summary?: Json | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          alt_text: string | null
          created_at: string | null
          file_size: number | null
          height: number | null
          id: string
          listing_id: string | null
          mime_type: string | null
          type: Database["public"]["Enums"]["asset_type_enum"]
          url: string
          user_id: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          listing_id?: string | null
          mime_type?: string | null
          type: Database["public"]["Enums"]["asset_type_enum"]
          url: string
          user_id?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          listing_id?: string | null
          mime_type?: string | null
          type?: Database["public"]["Enums"]["asset_type_enum"]
          url?: string
          user_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          event_type: string
          id: string
          metadata: Json | null
          stripe_event_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          stripe_event_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          stripe_event_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_group: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_group?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_group?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          added_at: string | null
          collection_id: string
          listing_id: string
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          listing_id: string
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          curated_by: string | null
          description: string | null
          featured: boolean | null
          id: string
          is_active: boolean | null
          name: string
          public: boolean | null
          slug: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          curated_by?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          public?: boolean | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          curated_by?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          public?: boolean | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_curated_by_fkey"
            columns: ["curated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          listing_id: string
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          listing_id: string
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          listing_id?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_flags: {
        Row: {
          auto_flagged: boolean | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          reason: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          auto_flagged?: boolean | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          reason: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Update: {
          auto_flagged?: boolean | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          reason?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categorization_jobs: {
        Row: {
          attempt_count: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_hash: string | null
          listing_id: string
          max_attempts: number | null
          priority: number | null
          result: unknown | null
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_hash?: string | null
          listing_id: string
          max_attempts?: number | null
          priority?: number | null
          result?: unknown | null
          started_at?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_hash?: string | null
          listing_id?: string
          max_attempts?: number | null
          priority?: number | null
          result?: unknown | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorization_jobs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_accounts: {
        Row: {
          available_balance: number | null
          charges_enabled: boolean | null
          created_at: string | null
          id: string
          lifetime_revenue: number | null
          payouts_enabled: boolean | null
          pending_balance: number | null
          platform_fees_paid: number | null
          stripe_account_id: string | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          available_balance?: number | null
          charges_enabled?: boolean | null
          created_at?: string | null
          id?: string
          lifetime_revenue?: number | null
          payouts_enabled?: boolean | null
          pending_balance?: number | null
          platform_fees_paid?: number | null
          stripe_account_id?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          available_balance?: number | null
          charges_enabled?: boolean | null
          created_at?: string | null
          id?: string
          lifetime_revenue?: number | null
          payouts_enabled?: boolean | null
          pending_balance?: number | null
          platform_fees_paid?: number | null
          stripe_account_id?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string
          id: string
          name: string | null
          slug: string
          total_downloads: number | null
          total_listings: number | null
          total_revenue: number | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          name?: string | null
          slug: string
          total_downloads?: number | null
          total_listings?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          name?: string | null
          slug?: string
          total_downloads?: number | null
          total_listings?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      csrf_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "csrf_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      downloads: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          listing_id: string
          user_agent: string | null
          user_id: string | null
          version_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          listing_id: string
          user_agent?: string | null
          user_id?: string | null
          version_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          listing_id?: string
          user_agent?: string | null
          user_id?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downloads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downloads_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "listing_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          error: string | null
          id: string
          message_id: string | null
          recipient: string
          status: string
          subject: string
          type: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          error?: string | null
          id?: string
          message_id?: string | null
          recipient: string
          status?: string
          subject: string
          type: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          error?: string | null
          id?: string
          message_id?: string | null
          recipient?: string
          status?: string
          subject?: string
          type?: string
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          level: string
          message: string
          stack: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          level: string
          message: string
          stack?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          level?: string
          message?: string
          stack?: string | null
        }
        Relationships: []
      }
      feature_entitlements: {
        Row: {
          analytics_tier: string
          api_rate_limit: number
          can_use_ai_upload: boolean
          can_use_custom_domain: boolean
          can_verify_creator: boolean
          id: string
          max_applications: number
          max_featured_listings: number
          max_listings: number
          max_mcp_servers: number
          max_webhooks: number
          platform_fee_pct: number
          storage_gb: number
          support_tier: string
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analytics_tier?: string
          api_rate_limit?: number
          can_use_ai_upload?: boolean
          can_use_custom_domain?: boolean
          can_verify_creator?: boolean
          id?: string
          max_applications?: number
          max_featured_listings?: number
          max_listings?: number
          max_mcp_servers?: number
          max_webhooks?: number
          platform_fee_pct?: number
          storage_gb?: number
          support_tier?: string
          tier?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analytics_tier?: string
          api_rate_limit?: number
          can_use_ai_upload?: boolean
          can_use_custom_domain?: boolean
          can_verify_creator?: boolean
          id?: string
          max_applications?: number
          max_featured_listings?: number
          max_listings?: number
          max_mcp_servers?: number
          max_webhooks?: number
          platform_fee_pct?: number
          storage_gb?: number
          support_tier?: string
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      github_connections: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          github_access_token: string
          github_refresh_token: string | null
          github_user_id: string
          github_username: string
          id: string
          name: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          github_access_token: string
          github_refresh_token?: string | null
          github_user_id: string
          github_username: string
          id?: string
          name?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          github_access_token?: string
          github_refresh_token?: string | null
          github_user_id?: string
          github_username?: string
          id?: string
          name?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      listing_faqs: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          listing_id: string
          published: boolean
          question: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          listing_id: string
          published?: boolean
          question: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          listing_id?: string
          published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_faqs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_install_commands: {
        Row: {
          command: string
          created_at: string | null
          description: string | null
          id: string
          listing_id: string
          platform: Database["public"]["Enums"]["install_platform_enum"]
          prerequisites: string | null
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          command: string
          created_at?: string | null
          description?: string | null
          id?: string
          listing_id: string
          platform: Database["public"]["Enums"]["install_platform_enum"]
          prerequisites?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          command?: string
          created_at?: string | null
          description?: string | null
          id?: string
          listing_id?: string
          platform?: Database["public"]["Enums"]["install_platform_enum"]
          prerequisites?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_install_commands_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_categories: {
        Row: {
          category_id: string
          confidence: number | null
          created_at: string | null
          id: string
          is_ai_generated: boolean | null
          is_primary: boolean | null
          listing_id: string
          manual_override: boolean | null
          model_version: string | null
          reason: string | null
          updated_at: string | null
        }
        Insert: {
          category_id: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_primary?: boolean | null
          listing_id: string
          manual_override?: boolean | null
          model_version?: string | null
          reason?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_primary?: boolean | null
          listing_id?: string
          manual_override?: boolean | null
          model_version?: string | null
          reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_categories_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_category_analysis: {
        Row: {
          analyzed_content: unknown | null
          created_at: string | null
          generated_tags: string[] | null
          generated_topics: string[] | null
          id: string
          listing_id: string
          model_version: string | null
          updated_at: string | null
        }
        Insert: {
          analyzed_content?: unknown | null
          created_at?: string | null
          generated_tags?: string[] | null
          generated_topics?: string[] | null
          id?: string
          listing_id: string
          model_version?: string | null
          updated_at?: string | null
        }
        Update: {
          analyzed_content?: unknown | null
          created_at?: string | null
          generated_tags?: string[] | null
          generated_topics?: string[] | null
          id?: string
          listing_id?: string
          model_version?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_category_analysis_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_tags: {
        Row: {
          listing_id: string
          tag_id: string
        }
        Insert: {
          listing_id: string
          tag_id: string
        }
        Update: {
          listing_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_tags_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_versions: {
        Row: {
          changelog: string | null
          created_at: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          listing_id: string
          version_name: string
          version_number: number
        }
        Insert: {
          changelog?: string | null
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          listing_id: string
          version_name: string
          version_number: number
        }
        Update: {
          changelog?: string | null
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          listing_id?: string
          version_name?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_versions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_prompts: {
        Row: {
          created_at: string | null
          github_url: string
          id: string
          listing_id: string
          prompt: string
          skill_md_missing: boolean | null
          skill_md_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          github_url: string
          id?: string
          listing_id: string
          prompt: string
          skill_md_missing?: boolean | null
          skill_md_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          github_url?: string
          id?: string
          listing_id?: string
          prompt?: string
          skill_md_missing?: boolean | null
          skill_md_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_prompts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          average_rating: number | null
          category_id: string | null
          created_at: string | null
          creator_id: string
          description: string
          downloads: number | null
          featured: boolean | null
          files: Json | null
          github_url: string | null
          id: string
          images: string[] | null
          language: string | null
          license: string | null
          price: number
          quality_score: number | null
          readme: string | null
          review_count: number | null
          search_rank_weight: number | null
          search_vector: unknown
          seo_title: string | null
          short_description: string | null
          slug: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["listing_status_enum"] | null
          tags: string[] | null
          title: string
          topics: string[] | null
          type: Database["public"]["Enums"]["listing_type_enum"]
          updated_at: string | null
          views: number | null
        }
        Insert: {
          average_rating?: number | null
          category_id?: string | null
          created_at?: string | null
          creator_id: string
          description: string
          downloads?: number | null
          featured?: boolean | null
          files?: Json | null
          github_url?: string | null
          id?: string
          images?: string[] | null
          language?: string | null
          license?: string | null
          price?: number
          quality_score?: number | null
          readme?: string | null
          review_count?: number | null
          search_rank_weight?: number | null
          search_vector?: unknown
          seo_title?: string | null
          short_description?: string | null
          slug?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["listing_status_enum"] | null
          tags?: string[] | null
          title: string
          topics?: string[] | null
          type: Database["public"]["Enums"]["listing_type_enum"]
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          average_rating?: number | null
          category_id?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string
          downloads?: number | null
          featured?: boolean | null
          files?: Json | null
          github_url?: string | null
          id?: string
          images?: string[] | null
          language?: string | null
          license?: string | null
          price?: number
          quality_score?: number | null
          readme?: string | null
          review_count?: number | null
          search_rank_weight?: number | null
          search_vector?: unknown
          seo_title?: string | null
          short_description?: string | null
          slug?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["listing_status_enum"] | null
          tags?: string[] | null
          title?: string
          topics?: string[] | null
          type?: Database["public"]["Enums"]["listing_type_enum"]
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_connections: {
        Row: {
          connection_config: Json | null
          created_at: string | null
          id: string
          last_connected_at: string | null
          mcp_server_id: string
          status: string | null
          total_requests: number | null
          user_id: string
        }
        Insert: {
          connection_config?: Json | null
          created_at?: string | null
          id?: string
          last_connected_at?: string | null
          mcp_server_id: string
          status?: string | null
          total_requests?: number | null
          user_id: string
        }
        Update: {
          connection_config?: Json | null
          created_at?: string | null
          id?: string
          last_connected_at?: string | null
          mcp_server_id?: string
          status?: string | null
          total_requests?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_connections_mcp_server_id_fkey"
            columns: ["mcp_server_id"]
            isOneToOne: false
            referencedRelation: "mcp_servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_servers: {
        Row: {
          avg_latency_ms: number | null
          created_at: string | null
          description: string | null
          endpoint: string
          health_check_url: string | null
          id: string
          last_health_check: string | null
          name: string
          status: Database["public"]["Enums"]["mcp_server_status_enum"] | null
          total_requests: number | null
          updated_at: string | null
          user_id: string
          version: string
        }
        Insert: {
          avg_latency_ms?: number | null
          created_at?: string | null
          description?: string | null
          endpoint: string
          health_check_url?: string | null
          id?: string
          last_health_check?: string | null
          name: string
          status?: Database["public"]["Enums"]["mcp_server_status_enum"] | null
          total_requests?: number | null
          updated_at?: string | null
          user_id: string
          version: string
        }
        Update: {
          avg_latency_ms?: number | null
          created_at?: string | null
          description?: string | null
          endpoint?: string
          health_check_url?: string | null
          id?: string
          last_health_check?: string | null
          name?: string
          status?: Database["public"]["Enums"]["mcp_server_status_enum"] | null
          total_requests?: number | null
          updated_at?: string | null
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_servers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          last_used_at: string | null
          mcp_server_id: string
          permissions: string[] | null
          token_hash: string
          token_value: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          mcp_server_id: string
          permissions?: string[] | null
          token_hash: string
          token_value?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          mcp_server_id?: string
          permissions?: string[] | null
          token_hash?: string
          token_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_tokens_mcp_server_id_fkey"
            columns: ["mcp_server_id"]
            isOneToOne: false
            referencedRelation: "mcp_servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_usage: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          latency_ms: number
          mcp_server_id: string | null
          mcp_token_id: string | null
          method: string
          request_size: number | null
          response_size: number | null
          status_code: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          latency_ms: number
          mcp_server_id?: string | null
          mcp_token_id?: string | null
          method: string
          request_size?: number | null
          response_size?: number | null
          status_code: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          latency_ms?: number
          mcp_server_id?: string | null
          mcp_token_id?: string | null
          method?: string
          request_size?: number | null
          response_size?: number | null
          status_code?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_usage_mcp_server_id_fkey"
            columns: ["mcp_server_id"]
            isOneToOne: false
            referencedRelation: "mcp_servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_usage_mcp_token_id_fkey"
            columns: ["mcp_token_id"]
            isOneToOne: false
            referencedRelation: "mcp_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          receiver_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_reports: {
        Row: {
          action_taken: string | null
          comment_id: string | null
          created_at: string | null
          description: string | null
          id: string
          listing_id: string | null
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          action_taken?: string | null
          comment_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          listing_id?: string | null
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          action_taken?: string | null
          comment_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          listing_id?: string | null
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string | null
          expires_at: string | null
          icon_name: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string
          read: boolean | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type_enum"] | null
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          icon_name?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string
          read?: boolean | null
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type_enum"] | null
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          icon_name?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type_enum"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorizations: {
        Row: {
          application_id: string
          code: string
          created_at: string | null
          expires_at: string
          id: string
          scope: string
          user_id: string
        }
        Insert: {
          application_id: string
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          scope: string
          user_id: string
        }
        Update: {
          application_id?: string
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          scope?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_tokens: {
        Row: {
          application_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          refresh_token: string | null
          scope: string | null
          scopes: string[] | null
          token_hash: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          scope?: string | null
          scopes?: string[] | null
          token_hash: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          scope?: string | null
          scopes?: string[] | null
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string | null
          id: string
          path: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          path: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          path?: string
          user_id?: string | null
        }
        Relationships: []
      }
      password_resets: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          created_at: string | null
          creator_id: string | null
          currency: string | null
          id: string
          metadata: Json | null
          period_end: string | null
          period_start: string | null
          status: string | null
          stripe_payout_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_payout_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_payout_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcement_reads: {
        Row: {
          action: string | null
          announcement_id: string
          confirmed_at: string | null
          dismissed_at: string
          user_id: string
        }
        Insert: {
          action?: string | null
          announcement_id: string
          confirmed_at?: string | null
          dismissed_at?: string
          user_id: string
        }
        Update: {
          action?: string | null
          announcement_id?: string
          confirmed_at?: string | null
          dismissed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "platform_announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcements: {
        Row: {
          action_label: string | null
          action_url: string | null
          active: boolean
          body: string
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["platform_announcement_kind"]
          published_at: string
          target_role: Database["public"]["Enums"]["role_enum"] | null
          title: string
          version: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          active?: boolean
          body: string
          created_at?: string
          created_by: string
          id?: string
          kind?: Database["public"]["Enums"]["platform_announcement_kind"]
          published_at?: string
          target_role?: Database["public"]["Enums"]["role_enum"] | null
          title: string
          version?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          active?: boolean
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          kind?: Database["public"]["Enums"]["platform_announcement_kind"]
          published_at?: string
          target_role?: Database["public"]["Enums"]["role_enum"] | null
          title?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          github: string | null
          id: string
          linkedin: string | null
          location: string | null
          twitter: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          github?: string | null
          id?: string
          linkedin?: string | null
          location?: string | null
          twitter?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          github?: string | null
          id?: string
          linkedin?: string | null
          location?: string | null
          twitter?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_alerts: {
        Row: {
          created_at: string | null
          current_usage: number
          id: string
          identifier: string
          rate_limit: number
          severity: string
          type: string
        }
        Insert: {
          created_at?: string | null
          current_usage: number
          id?: string
          identifier: string
          rate_limit: number
          severity: string
          type: string
        }
        Update: {
          created_at?: string | null
          current_usage?: number
          id?: string
          identifier?: string
          rate_limit?: number
          severity?: string
          type?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          id: string
          identifier: string
          requests: number[]
          reset_at: number
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          identifier: string
          requests?: number[]
          reset_at: number
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          identifier?: string
          requests?: number[]
          reset_at?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_amount: number | null
          commission_paid: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          referral_code_id: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          commission_amount?: number | null
          commission_paid?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code_id: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          commission_amount?: number | null
          commission_paid?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code_id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          response: string
          review_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          response: string
          review_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          response?: string
          review_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          listing_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          listing_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alert_email: boolean
          alert_push: boolean
          created_at: string
          filters: Json
          id: string
          last_alerted_at: string | null
          name: string
          query: string | null
          user_id: string
        }
        Insert: {
          alert_email?: boolean
          alert_push?: boolean
          created_at?: string
          filters?: Json
          id?: string
          last_alerted_at?: string | null
          name: string
          query?: string | null
          user_id: string
        }
        Update: {
          alert_email?: boolean
          alert_push?: boolean
          created_at?: string
          filters?: Json
          id?: string
          last_alerted_at?: string | null
          name?: string
          query?: string | null
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          contact_email: string | null
          id: string
          maintenance_mode: boolean | null
          minimum_payout: number | null
          platform_fee: number | null
          site_description: string | null
          site_name: string | null
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          id?: string
          maintenance_mode?: boolean | null
          minimum_payout?: number | null
          platform_fee?: number | null
          site_description?: string | null
          site_name?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          id?: string
          maintenance_mode?: boolean | null
          minimum_payout?: number | null
          platform_fee?: number | null
          site_description?: string | null
          site_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          stripe_customer_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          stripe_customer_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          stripe_customer_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: Database["public"]["Enums"]["subscription_status_enum"] | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier_enum"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?:
            | Database["public"]["Enums"]["subscription_status_enum"]
            | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier_enum"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?:
            | Database["public"]["Enums"]["subscription_status_enum"]
            | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier_enum"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          creator_id: string | null
          fee: number | null
          id: string
          listing_id: string | null
          net_amount: number
          status: Database["public"]["Enums"]["transaction_status_enum"] | null
          stripe_payment_intent_id: string | null
          type: Database["public"]["Enums"]["transaction_type_enum"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          creator_id?: string | null
          fee?: number | null
          id?: string
          listing_id?: string | null
          net_amount: number
          status?: Database["public"]["Enums"]["transaction_status_enum"] | null
          stripe_payment_intent_id?: string | null
          type: Database["public"]["Enums"]["transaction_type_enum"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          creator_id?: string | null
          fee?: number | null
          id?: string
          listing_id?: string | null
          net_amount?: number
          status?: Database["public"]["Enums"]["transaction_status_enum"] | null
          stripe_payment_intent_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type_enum"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          quantity: number | null
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          quantity?: number | null
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          quantity?: number | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_milestones: {
        Row: {
          achieved_at: string
          id: string
          metadata: Json | null
          milestone_key: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          id?: string
          metadata?: Json | null
          milestone_key: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          id?: string
          metadata?: Json | null
          milestone_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          language: string | null
          marketing_emails: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          marketing_emails?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          marketing_emails?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          discord_url: string | null
          email: string
          github_url: string | null
          github_username: string | null
          id: string
          linkedin_url: string | null
          name: string | null
          role: Database["public"]["Enums"]["role_enum"] | null
          twitter_username: string | null
          updated_at: string | null
          website: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          discord_url?: string | null
          email: string
          github_url?: string | null
          github_username?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["role_enum"] | null
          twitter_username?: string | null
          updated_at?: string | null
          website?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          discord_url?: string | null
          email?: string
          github_url?: string | null
          github_username?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["role_enum"] | null
          twitter_username?: string | null
          updated_at?: string | null
          website?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      watchlist_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: Database["public"]["Enums"]["watchlist_item_type"]
          label: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: Database["public"]["Enums"]["watchlist_item_type"]
          label?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["watchlist_item_type"]
          label?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_dead_letter_queue: {
        Row: {
          failed_at: string | null
          id: string
          payload: Json
          reason: string
          retry_count: number | null
          webhook_id: string
        }
        Insert: {
          failed_at?: string | null
          id?: string
          payload: Json
          reason: string
          retry_count?: number | null
          webhook_id: string
        }
        Update: {
          failed_at?: string | null
          id?: string
          payload?: Json
          reason?: string
          retry_count?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_dead_letter_queue_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempts: number | null
          created_at: string | null
          delivered_at: string | null
          event: Database["public"]["Enums"]["webhook_event_enum"]
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_code: number | null
          status: Database["public"]["Enums"]["delivery_status_enum"] | null
          webhook_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          delivered_at?: string | null
          event: Database["public"]["Enums"]["webhook_event_enum"]
          id?: string
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          response_code?: number | null
          status?: Database["public"]["Enums"]["delivery_status_enum"] | null
          webhook_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          delivered_at?: string | null
          event?: Database["public"]["Enums"]["webhook_event_enum"]
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_code?: number | null
          status?: Database["public"]["Enums"]["delivery_status_enum"] | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          events: Database["public"]["Enums"]["webhook_event_enum"][]
          failed_deliveries: number | null
          id: string
          last_delivery_at: string | null
          name: string
          secret: string
          status: Database["public"]["Enums"]["webhook_status_enum"] | null
          total_deliveries: number | null
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          events: Database["public"]["Enums"]["webhook_event_enum"][]
          failed_deliveries?: number | null
          id?: string
          last_delivery_at?: string | null
          name: string
          secret: string
          status?: Database["public"]["Enums"]["webhook_status_enum"] | null
          total_deliveries?: number | null
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          events?: Database["public"]["Enums"]["webhook_event_enum"][]
          failed_deliveries?: number | null
          id?: string
          last_delivery_at?: string | null
          name?: string
          secret?: string
          status?: Database["public"]["Enums"]["webhook_status_enum"] | null
          total_deliveries?: number | null
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_conversation_memory: {
        Row: {
          context_snapshot: Json | null
          conversation_history: Json | null
          created_at: string
          expansion_id: string
          file_change_purposes: Json | null
          id: string
          last_round: number | null
          total_interactions: number | null
          updated_at: string
        }
        Insert: {
          context_snapshot?: Json | null
          conversation_history?: Json | null
          created_at?: string
          expansion_id: string
          file_change_purposes?: Json | null
          id?: string
          last_round?: number | null
          total_interactions?: number | null
          updated_at?: string
        }
        Update: {
          context_snapshot?: Json | null
          conversation_history?: Json | null
          created_at?: string
          expansion_id?: string
          file_change_purposes?: Json | null
          id?: string
          last_round?: number | null
          total_interactions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_conversation_memory_expansion_id_fkey"
            columns: ["expansion_id"]
            isOneToOne: false
            referencedRelation: "workflow_expansions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_expansion_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          expansion_id: string
          id: string
          output: Json | null
          started_at: string | null
          status: string
          step_name: string
          step_order: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          expansion_id: string
          id?: string
          output?: Json | null
          started_at?: string | null
          status?: string
          step_name: string
          step_order?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          expansion_id?: string
          id?: string
          output?: Json | null
          started_at?: string | null
          status?: string
          step_name?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflow_expansion_steps_expansion_id_fkey"
            columns: ["expansion_id"]
            isOneToOne: false
            referencedRelation: "workflow_expansions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_expansions: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          created_at: string
          current_file: string | null
          deleted_at: string | null
          description: string | null
          error_message: string | null
          expansion_config: Json | null
          file_count: number | null
          generated_files: Json | null
          github_commit_sha: string | null
          github_push_status: string | null
          github_repo_url: string | null
          id: string
          latest_memory_id: string | null
          pipeline_progress: number | null
          pipeline_stage: string | null
          session_id: string | null
          source_artifacts: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["workflow_expansion_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_file?: string | null
          deleted_at?: string | null
          description?: string | null
          error_message?: string | null
          expansion_config?: Json | null
          file_count?: number | null
          generated_files?: Json | null
          github_commit_sha?: string | null
          github_push_status?: string | null
          github_repo_url?: string | null
          id?: string
          latest_memory_id?: string | null
          pipeline_progress?: number | null
          pipeline_stage?: string | null
          session_id?: string | null
          source_artifacts?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_expansion_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_file?: string | null
          deleted_at?: string | null
          description?: string | null
          error_message?: string | null
          expansion_config?: Json | null
          file_count?: number | null
          generated_files?: Json | null
          github_commit_sha?: string | null
          github_push_status?: string | null
          github_repo_url?: string | null
          id?: string
          latest_memory_id?: string | null
          pipeline_progress?: number | null
          pipeline_stage?: string | null
          session_id?: string | null
          source_artifacts?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_expansion_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_expansions_latest_memory_id_fkey"
            columns: ["latest_memory_id"]
            isOneToOne: false
            referencedRelation: "workflow_conversation_memory"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_icon_name?: string
          p_message: string
          p_metadata?: Json
          p_priority?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_webhook: {
        Args: {
          p_events: string[]
          p_name: string
          p_secret: string
          p_url: string
          p_user_id: string
        }
        Returns: undefined
      }
      daitch_mokotoff: { Args: { "": string }; Returns: string[] }
      dmetaphone: { Args: { "": string }; Returns: string }
      dmetaphone_alt: { Args: { "": string }; Returns: string }
      get_listing_type_enum_values: {
        Args: never
        Returns: {
          value: string
        }[]
      }
      get_recently_viewed_listings: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          average_rating: number
          created_at: string
          creator: Json
          description: string
          downloads: number
          featured: boolean
          id: string
          images: string[]
          price: number
          review_count: number
          tags: string[]
          title: string
          type: Database["public"]["Enums"]["listing_type_enum"]
          updated_at: string
          views: number
        }[]
      }
      get_recommendations_because_you_downloaded: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          average_rating: number
          created_at: string
          creator: Json
          description: string
          downloads: number
          featured: boolean
          id: string
          images: string[]
          price: number
          review_count: number
          tags: string[]
          title: string
          type: Database["public"]["Enums"]["listing_type_enum"]
          updated_at: string
          views: number
        }[]
      }
      get_category_counts: {
        Args: never
        Returns: {
          count: number
          slug: string
        }[]
      }
      get_categorization_status: {
        Args: never
        Returns: {
          completed: number
          failed: number
          pending: number
          processing: number
          total: number
        }[]
      }
      get_listings_by_category: {
        Args: {
          p_category_slug: string
          p_limit?: number
          p_offset?: number
          p_sort?: string
          p_status?: string
        }
        Returns: {
          average_rating: number
          confidence: number
          created_at: string
          creator: Json
          description: string
          downloads: number
          featured: boolean
          id: string
          images: string[]
          is_primary: boolean
          price: number
          review_count: number
          short_description: string
          seo_title: string
          tags: string[]
          title: string
          type: string
          updated_at: string
          views: number
        }[]
      }
      get_low_confidence_categories: {
        Args: { p_limit?: number; p_threshold?: number }
        Returns: {
          category_name: string
          category_slug: string
          confidence: number
          listing_id: string
          reason: string
          title: string
        }[]
      }
      get_uncategorized_listings: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          category_count: number
          created_at: string
          id: string
          status: string
          title: string
          type: string
        }[]
      }
      search_listings_by_category: {
        Args: {
          p_category_slug: string
          p_limit?: number
          p_query: string
          p_status?: string
        }
        Returns: {
          average_rating: number
          created_at: string
          creator: Json
          downloads: number
          featured: boolean
          id: string
          images: string[]
          price: number
          rank: number
          review_count: number
          short_description: string
          seo_title: string
          tags: string[]
          title: string
          type: string
          updated_at: string
          views: number
        }[]
      }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soundex: { Args: { "": string }; Returns: string }
      text_soundex: { Args: { "": string }; Returns: string }
    }
    Enums: {
      api_key_status_enum: "ACTIVE" | "REVOKED" | "EXPIRED"
      application_status_enum: "ACTIVE" | "SUSPENDED"
      asset_type_enum:
        | "THUMBNAIL"
        | "GALLERY"
        | "BANNER"
        | "DOCUMENTATION"
        | "AVATAR"
      delivery_status_enum: "PENDING" | "DELIVERED" | "FAILED" | "RETRYING"
      install_platform_enum:
        | "CURSOR"
        | "CLAUDE_CODE"
        | "CLAUDE_DESKTOP"
        | "WINDSURF"
        | "VSCODE"
        | "GITHUB_COPILOT"
        | "CLI"
        | "NPM"
        | "MANUAL"
        | "OTHER"
      listing_status_enum:
        | "DRAFT"
        | "PENDING"
        | "ACTIVE"
        | "REJECTED"
        | "SUSPENDED"
      listing_type_enum:
        | "SKILL"
        | "PLUGIN"
        | "MCP"
        | "AGENT"
        | "PROMPT"
        | "WORKFLOW"
        | "TEMPLATE"
        | "AUTOMATION"
        | "DEVELOPER_TOOL"
      log_level_enum: "INFO" | "WARN" | "ERROR"
      mcp_server_status_enum: "ACTIVE" | "INACTIVE" | "ERROR"
      notification_type_enum:
        | "REVIEW"
        | "BOOKMARK"
        | "DOWNLOAD"
        | "PURCHASE"
        | "SYSTEM"
        | "MODERATION"
        | "BILLING"
        | "PROMOTIONS"
        | "MARKETPLACE"
        | "MESSAGES"
        | "LEADS"
        | "JOBS"
        | "AI_ASSISTANT"
        | "ANNOUNCEMENTS"
      platform_announcement_kind: "CHANGELOG" | "BANNER"
      role_enum: "USER" | "CREATOR" | "ADMIN" | "MODERATOR" | "OWNER"
      subscription_status_enum: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING"
      subscription_tier_enum:
        | "FREE"
        | "PRO"
        | "ENTERPRISE"
        | "STARTER"
        | "BUSINESS"
      transaction_status_enum: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
      transaction_type_enum: "PURCHASE" | "PAYOUT" | "REFUND" | "COMMISSION"
      watchlist_item_type: "LISTING" | "CREATOR" | "SEARCH"
      webhook_event_enum:
        | "LISTING_CREATED"
        | "LISTING_UPDATED"
        | "LISTING_DELETED"
        | "PURCHASE_COMPLETED"
        | "PURCHASE_REFUNDED"
        | "REVIEW_CREATED"
        | "CREATOR_FOLLOWED"
        | "SUBSCRIPTION_UPDATED"
        | "MCP_CREATED"
        | "MCP_UPDATED"
        | "WORKFLOW_CREATED"
        | "WORKFLOW_UPDATED"
        | "AGENT_CREATED"
        | "AGENT_UPDATED"
      webhook_status_enum: "ACTIVE" | "PAUSED" | "ERROR"
      workflow_expansion_status:
        | "DRAFT"
        | "IMPORTED"
        | "INITIALIZING"
        | "RUNNING"
        | "PROCESSING_AI"
        | "GENERATING_FILES"
        | "COMPLETED"
        | "FAILED"
        | "ARCHIVED"
        | "ANALYZING"
        | "ANALYZED"
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
      api_key_status_enum: ["ACTIVE", "REVOKED", "EXPIRED"],
      application_status_enum: ["ACTIVE", "SUSPENDED"],
      asset_type_enum: [
        "THUMBNAIL",
        "GALLERY",
        "BANNER",
        "DOCUMENTATION",
        "AVATAR",
      ],
      delivery_status_enum: ["PENDING", "DELIVERED", "FAILED", "RETRYING"],
      install_platform_enum: [
        "CURSOR",
        "CLAUDE_CODE",
        "CLAUDE_DESKTOP",
        "WINDSURF",
        "VSCODE",
        "GITHUB_COPILOT",
        "CLI",
        "NPM",
        "MANUAL",
        "OTHER",
      ],
      listing_status_enum: [
        "DRAFT",
        "PENDING",
        "ACTIVE",
        "REJECTED",
        "SUSPENDED",
      ],
      listing_type_enum: [
        "SKILL",
        "PLUGIN",
        "MCP",
        "AGENT",
        "PROMPT",
        "WORKFLOW",
        "TEMPLATE",
        "AUTOMATION",
        "DEVELOPER_TOOL",
      ],
      log_level_enum: ["INFO", "WARN", "ERROR"],
      mcp_server_status_enum: ["ACTIVE", "INACTIVE", "ERROR"],
      notification_type_enum: [
        "REVIEW",
        "BOOKMARK",
        "DOWNLOAD",
        "PURCHASE",
        "SYSTEM",
        "MODERATION",
        "BILLING",
        "PROMOTIONS",
        "MARKETPLACE",
        "MESSAGES",
        "LEADS",
        "JOBS",
        "AI_ASSISTANT",
        "ANNOUNCEMENTS",
      ],
      platform_announcement_kind: ["CHANGELOG", "BANNER"],
      role_enum: ["USER", "CREATOR", "ADMIN", "MODERATOR", "OWNER"],
      subscription_status_enum: ["ACTIVE", "CANCELLED", "EXPIRED", "PENDING"],
      subscription_tier_enum: [
        "FREE",
        "PRO",
        "ENTERPRISE",
        "STARTER",
        "BUSINESS",
      ],
      transaction_status_enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      transaction_type_enum: ["PURCHASE", "PAYOUT", "REFUND", "COMMISSION"],
      watchlist_item_type: ["LISTING", "CREATOR", "SEARCH"],
      webhook_event_enum: [
        "LISTING_CREATED",
        "LISTING_UPDATED",
        "LISTING_DELETED",
        "PURCHASE_COMPLETED",
        "PURCHASE_REFUNDED",
        "REVIEW_CREATED",
        "CREATOR_FOLLOWED",
        "SUBSCRIPTION_UPDATED",
        "MCP_CREATED",
        "MCP_UPDATED",
        "WORKFLOW_CREATED",
        "WORKFLOW_UPDATED",
        "AGENT_CREATED",
        "AGENT_UPDATED",
      ],
      webhook_status_enum: ["ACTIVE", "PAUSED", "ERROR"],
      workflow_expansion_status: [
        "DRAFT",
        "IMPORTED",
        "INITIALIZING",
        "RUNNING",
        "PROCESSING_AI",
        "GENERATING_FILES",
        "COMPLETED",
        "FAILED",
        "ARCHIVED",
        "ANALYZING",
        "ANALYZED",
      ],
    },
  },
} as const

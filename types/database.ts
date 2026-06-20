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
      analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          listing_id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          listing_id: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          listing_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          key_value: string
          last_used_at: string | null
          name: string
          permissions: string[] | null
          rate_limit: number | null
          status: Database["public"]["Enums"]["api_key_status_enum"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          key_value: string
          last_used_at?: string | null
          name: string
          permissions?: string[] | null
          rate_limit?: number | null
          status?: Database["public"]["Enums"]["api_key_status_enum"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          key_value?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[] | null
          rate_limit?: number | null
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
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
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
          description: string | null
          id: string
          name: string
          public: boolean | null
          slug: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          public?: boolean | null
          slug: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          public?: boolean | null
          slug?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      downloads: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          listing_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          listing_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          listing_id?: string
          user_agent?: string | null
          user_id?: string | null
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
      listings: {
        Row: {
          average_rating: number | null
          category_id: string | null
          created_at: string | null
          creator_id: string
          description: string
          downloads: number | null
          files: Json | null
          id: string
          images: string[] | null
          price: number
          review_count: number | null
          slug: string | null
          status: Database["public"]["Enums"]["listing_status_enum"] | null
          tags: string[] | null
          title: string
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
          files?: Json | null
          id?: string
          images?: string[] | null
          price?: number
          review_count?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["listing_status_enum"] | null
          tags?: string[] | null
          title: string
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
          files?: Json | null
          id?: string
          images?: string[] | null
          price?: number
          review_count?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["listing_status_enum"] | null
          tags?: string[] | null
          title?: string
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
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type_enum"] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: Database["public"]["Enums"]["notification_type_enum"] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
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
      oauth_tokens: {
        Row: {
          application_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          scopes: string[] | null
          token_hash: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          scopes?: string[] | null
          token_hash: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
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
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: Database["public"]["Enums"]["subscription_status_enum"] | null
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
          created_at: string | null
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["role_enum"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["role_enum"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["role_enum"] | null
          updated_at?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
      role_enum: "USER" | "CREATOR" | "ADMIN" | "MODERATOR" | "OWNER"
      subscription_status_enum: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING"
      subscription_tier_enum: "FREE" | "PRO" | "ENTERPRISE"
      transaction_status_enum: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
      transaction_type_enum: "PURCHASE" | "PAYOUT" | "REFUND" | "COMMISSION"
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
      ],
      role_enum: ["USER", "CREATOR", "ADMIN", "MODERATOR", "OWNER"],
      subscription_status_enum: ["ACTIVE", "CANCELLED", "EXPIRED", "PENDING"],
      subscription_tier_enum: ["FREE", "PRO", "ENTERPRISE"],
      transaction_status_enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      transaction_type_enum: ["PURCHASE", "PAYOUT", "REFUND", "COMMISSION"],
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
    },
  },
} as const


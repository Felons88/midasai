export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      }
      creators: {
        Row: {
          banner_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string
          id: string
          slug: string
          total_downloads: number | null
          total_listings: number | null
          total_revenue: number | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          slug: string
          total_downloads?: number | null
          total_listings?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          slug?: string
          total_downloads?: number | null
          total_listings?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
        }
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
      }
      listings: {
        Row: {
          category_id: string | null
          created_at: string | null
          creator_id: string
          description: string
          downloads: number | null
          files: Json | null
          id: string
          images: string[] | null
          price: number
          status: Database["public"]["Enums"]["listing_status_enum"] | null
          title: string
          type: Database["public"]["Enums"]["listing_type_enum"]
          updated_at: string | null
          views: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          creator_id: string
          description: string
          downloads?: number | null
          files?: Json | null
          id?: string
          images?: string[] | null
          price?: number
          status?: Database["public"]["Enums"]["listing_status_enum"] | null
          title: string
          type: Database["public"]["Enums"]["listing_type_enum"]
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string
          downloads?: number | null
          files?: Json | null
          id?: string
          images?: string[] | null
          price?: number
          status?: Database["public"]["Enums"]["listing_status_enum"] | null
          title?: string
          type?: Database["public"]["Enums"]["listing_type_enum"]
          updated_at?: string | null
          views?: number | null
        }
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
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          user_id?: string
        }
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
      }
      site_settings: {
        Row: {
          contact_email: string | null
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
          id?: string
          maintenance_mode?: boolean | null
          minimum_payout?: number | null
          platform_fee?: number | null
          site_description?: string | null
          site_name?: string | null
          updated_at?: string | null
        }
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
          status?: Database["public"]["Enums"]["subscription_status_enum"] | null
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
          status?: Database["public"]["Enums"]["subscription_status_enum"] | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier_enum"] | null
          updated_at?: string | null
          user_id?: string
        }
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
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
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
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      asset_type_enum:
        | "THUMBNAIL"
        | "GALLERY"
        | "BANNER"
        | "DOCUMENTATION"
        | "AVATAR"
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
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

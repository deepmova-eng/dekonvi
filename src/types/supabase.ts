export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          location: string
          images: string[]
          category: string
          seller_id: string
          status: 'active' | 'pending' | 'rejected'
          created_at: string
          delivery_available: boolean
          is_premium: boolean
          premium_until: string | null
          condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor' | null
          contact_phone: string | null
          hide_phone: boolean
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          location: string
          images: string[]
          category: string
          seller_id: string
          status?: 'active' | 'pending' | 'rejected'
          created_at?: string
          delivery_available?: boolean
          is_premium?: boolean
          premium_until?: string | null
          condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor' | null
          contact_phone?: string | null
          hide_phone?: boolean
        }
        Update: {
          title?: string
          description?: string
          price?: number
          location?: string
          images?: string[]
          category?: string
          status?: 'active' | 'pending' | 'rejected'
          delivery_available?: boolean
          is_premium?: boolean
          premium_until?: string | null
          condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor' | null
          contact_phone?: string | null
          hide_phone?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          phone: string | null
          location: string | null
          role: 'user' | 'admin'
          rating: number
          total_ratings: number
          is_recommended: boolean
          created_at: string
          last_seen: string
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          role?: 'user' | 'admin'
          rating?: number
          total_ratings?: number
          is_recommended?: boolean
          created_at?: string
          last_seen?: string
        }
        Update: {
          name?: string
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          role?: 'user' | 'admin'
          rating?: number
          total_ratings?: number
          is_recommended?: boolean
          last_seen?: string
        }
      }
      conversations: {
        Row: {
          id: string
          listing_id: string
          participants: string[]
          created_at: string
          last_message: Json | null
          unread_count: number
        }
        Insert: {
          id?: string
          listing_id: string
          participants: string[]
          created_at?: string
          last_message?: Json | null
          unread_count?: number
        }
        Update: {
          last_message?: Json | null
          unread_count?: number
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
          read: boolean
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          created_at?: string
          read?: boolean
        }
        Update: {
          read?: boolean
        }
      }
      reports: {
        Row: {
          id: string
          listing_id: string
          reporter_id: string
          reason: string
          description: string
          status: 'pending' | 'resolved' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          reporter_id: string
          reason: string
          description: string
          status?: 'pending' | 'resolved' | 'dismissed'
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'resolved' | 'dismissed'
        }
      }
      premium_requests: {
        Row: {
          id: string
          listing_id: string
          user_id: string
          status: 'pending' | 'approved' | 'rejected'
          duration: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          user_id: string
          status?: 'pending' | 'approved' | 'rejected'
          duration: number
          price: number
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
        }
      }
      advertisements: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string
          link: string | null
          order: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url: string
          link?: string | null
          order?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          image_url?: string
          link?: string | null
          order?: number
          active?: boolean
        }
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string
          seller_id: string
          listing_id: string | null
          rating: number
          comment: string | null
          status: 'pending' | 'approved' | 'rejected'
          proof_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          seller_id: string
          listing_id?: string | null
          rating: number
          comment?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          proof_image_url?: string | null
          created_at?: string
        }
        Update: {
          rating?: number
          comment?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          proof_image_url?: string | null
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          listing_id?: string
        }
      }
      settings: {
        Row: {
          id: string
          auto_approve_listings: boolean
          created_at: string
        }
        Insert: {
          id?: string
          auto_approve_listings?: boolean
          created_at?: string
        }
        Update: {
          auto_approve_listings?: boolean
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
      [_ in never]: never
    }
  }
}
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
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          provider: string
          encrypted_key: string
          key_name: string | null
          is_active: boolean
          last_used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          encrypted_key: string
          key_name?: string | null
          is_active?: boolean
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          encrypted_key?: string
          key_name?: string | null
          is_active?: boolean
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          provider: string
          prompt: string
          negative_prompt: string | null
          model_used: string | null
          image_url: string | null
          thumbnail_url: string | null
          format: string
          width: number | null
          height: number | null
          generation_time_ms: number | null
          cost_credits: number | null
          metadata: Json | null
          status: string
          error_message: string | null
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          prompt: string
          negative_prompt?: string | null
          model_used?: string | null
          image_url?: string | null
          thumbnail_url?: string | null
          format: string
          width?: number | null
          height?: number | null
          generation_time_ms?: number | null
          cost_credits?: number | null
          metadata?: Json | null
          status?: string
          error_message?: string | null
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          prompt?: string
          negative_prompt?: string | null
          model_used?: string | null
          image_url?: string | null
          thumbnail_url?: string | null
          format?: string
          width?: number | null
          height?: number | null
          generation_time_ms?: number | null
          cost_credits?: number | null
          metadata?: Json | null
          status?: string
          error_message?: string | null
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type User = Database['public']['Tables']['users']['Row']
export type ApiKey = Database['public']['Tables']['api_keys']['Row']
export type Generation = Database['public']['Tables']['generations']['Row']

export type InsertUser = Database['public']['Tables']['users']['Insert']
export type InsertApiKey = Database['public']['Tables']['api_keys']['Insert']
export type InsertGeneration = Database['public']['Tables']['generations']['Insert']

export type UpdateUser = Database['public']['Tables']['users']['Update']
export type UpdateApiKey = Database['public']['Tables']['api_keys']['Update']
export type UpdateGeneration = Database['public']['Tables']['generations']['Update']
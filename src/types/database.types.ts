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
      active_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          outcome: string | null
          profile_id: string
          signature: string
          started_at: string | null
          step_description: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          outcome?: string | null
          profile_id: string
          signature: string
          started_at?: string | null
          step_description: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          outcome?: string | null
          profile_id?: string
          signature?: string
          started_at?: string | null
          step_description?: string
        }
      }
      analytics_events: {
        Row: {
          event_type: string
          id: string
          payload: Json | null
          profile_id: string | null
          recorded_at: string
          signature: string | null
          user_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          payload?: Json | null
          profile_id?: string | null
          recorded_at?: string
          signature?: string | null
          user_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json | null
          profile_id?: string | null
          recorded_at?: string
          signature?: string | null
          user_id?: string | null
        }
      }
      feedback_comments: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          profile_id: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          profile_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          profile_id?: string | null
          user_id?: string | null
        }
      }
      feedback_records: {
        Row: {
          delta_but: number
          delta_ipp: number
          id: string
          outcome: string | null
          profile_id: string
          recorded_at: string
          signature: string
          slider: number
        }
        Insert: {
          delta_but: number
          delta_ipp: number
          id?: string
          outcome?: string | null
          profile_id: string
          recorded_at?: string
          signature: string
          slider: number
        }
        Update: {
          delta_but?: number
          delta_ipp?: number
          id?: string
          outcome?: string | null
          profile_id?: string
          recorded_at?: string
          signature?: string
          slider?: number
        }
      }
      profiles: {
        Row: {
          baseline_but: number
          baseline_ipp: number
          consent_to_store: boolean
          created_at: string
          metadata: Json | null
          profile_id: string
          strengths: string[]
          tags: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          baseline_but: number
          baseline_ipp: number
          consent_to_store?: boolean
          created_at?: string
          metadata?: Json | null
          profile_id: string
          strengths: string[]
          tags: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          baseline_but?: number
          baseline_ipp?: number
          consent_to_store?: boolean
          created_at?: string
          metadata?: Json | null
          profile_id?: string
          strengths?: string[]
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
      }
      signature_cache: {
        Row: {
          baseline_but: number
          baseline_ipp: number
          created_at: string
          expires_at: string | null
          is_saved: boolean
          normalized_input: Json
          profile_id: string
          response: Json
          signature: string
          tags: string[] | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          baseline_but: number
          baseline_ipp: number
          created_at?: string
          expires_at?: string | null
          is_saved?: boolean
          normalized_input: Json
          profile_id: string
          response: Json
          signature: string
          tags?: string[] | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          baseline_but?: number
          baseline_ipp?: number
          created_at?: string
          expires_at?: string | null
          is_saved?: boolean
          normalized_input?: Json
          profile_id?: string
          response?: Json
          signature?: string
          tags?: string[] | null
          title?: string | null
          user_id?: string | null
        }
      }
      step_metrics: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          outcome: string | null
          profile_id: string
          signature: string
          started_at: string | null
          step_description: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          outcome?: string | null
          profile_id: string
          signature: string
          started_at?: string | null
          step_description: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          outcome?: string | null
          profile_id?: string
          signature?: string
          started_at?: string | null
          step_description?: string
        }
      }
      user_daily_metrics: {
        Row: {
          created_at: string
          date: string
          id: string
          metrics: Json
          profile_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          metrics: Json
          profile_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          metrics?: Json
          profile_id?: string
          user_id?: string | null
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
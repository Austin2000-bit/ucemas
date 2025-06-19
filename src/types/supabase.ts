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
          first_name: string
          last_name: string
          role: 'admin' | 'helper' | 'student' | 'driver'
          phone: string | null
          disability_type: string | null
          bank_name: 'CRDB' | 'NBC' | null
          bank_account_number: string | null
          assistant_type: 'undergraduate' | 'postgraduate' | null
          assistant_specialization: 'reader' | 'note_taker' | 'mobility_assistant' | null
          time_period: 'full_year' | 'semester' | 'half_semester' | null
          status: 'active' | 'completed' | 'inactive' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: 'admin' | 'helper' | 'student' | 'driver'
          phone?: string | null
          disability_type?: string | null
          bank_name?: 'CRDB' | 'NBC' | null
          bank_account_number?: string | null
          assistant_type?: 'undergraduate' | 'postgraduate' | null
          assistant_specialization?: 'reader' | 'note_taker' | 'mobility_assistant' | null
          time_period?: 'full_year' | 'semester' | 'half_semester' | null
          status?: 'active' | 'completed' | 'inactive' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'admin' | 'helper' | 'student' | 'driver'
          phone?: string | null
          disability_type?: string | null
          bank_name?: 'CRDB' | 'NBC' | null
          bank_account_number?: string | null
          assistant_type?: 'undergraduate' | 'postgraduate' | null
          assistant_specialization?: 'reader' | 'note_taker' | 'mobility_assistant' | null
          time_period?: 'full_year' | 'semester' | 'half_semester' | null
          status?: 'active' | 'completed' | 'inactive' | null
          created_at?: string
          updated_at?: string
        }
      }
      helper_student_assignments: {
        Row: {
          id: string
          helper_id: string
          student_id: string
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          helper_id: string
          student_id: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          helper_id?: string
          student_id?: string
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      student_help_confirmations: {
        Row: {
          id: string
          student_id: string
          helper_id: string
          date: string
          status: 'pending' | 'confirmed' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          helper_id: string
          date: string
          status?: 'pending' | 'confirmed' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          helper_id?: string
          date?: string
          status?: 'pending' | 'confirmed' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      complaints: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          status: 'pending' | 'in_progress' | 'resolved'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          status?: 'pending' | 'in_progress' | 'resolved'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          status?: 'pending' | 'in_progress' | 'resolved'
          created_at?: string
          updated_at?: string
        }
      }
      ride_requests: {
        Row: {
          id: string
          student_id: string
          driver_id: string | null
          pickup_location: string
          destination: string
          status: 'pending' | 'accepted' | 'rejected' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          driver_id?: string | null
          pickup_location: string
          destination: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          driver_id?: string | null
          pickup_location?: string
          destination?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          helper_id: string
          student_id: string
          otp: string | null
          otp_expiry: string | null
          status: 'pending_confirmation' | 'confirmed' | 'expired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          helper_id: string
          student_id: string
          otp?: string | null
          otp_expiry?: string | null
          status?: 'pending_confirmation' | 'confirmed' | 'expired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          helper_id?: string
          student_id?: string
          otp?: string | null
          otp_expiry?: string | null
          status?: 'pending_confirmation' | 'confirmed' | 'expired'
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
  }
} 

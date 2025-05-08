
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
          created_at: string
          updated_at: string
          disability_type?: string
          assistant_type?: string
          assistant_specialization?: string
          profile_picture?: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: 'admin' | 'helper' | 'student' | 'driver'
          created_at?: string
          updated_at?: string
          disability_type?: string
          assistant_type?: string
          assistant_specialization?: string
          profile_picture?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'admin' | 'helper' | 'student' | 'driver'
          created_at?: string
          updated_at?: string
          disability_type?: string
          assistant_type?: string
          assistant_specialization?: string
          profile_picture?: string
        }
      }
      helper_student_assignments: {
        Row: {
          id: string
          helper_id: string
          student_id: string
          status: 'active' | 'inactive'
          academic_year: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          helper_id: string
          student_id: string
          status?: 'active' | 'inactive'
          academic_year: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          helper_id?: string
          student_id?: string
          status?: 'active' | 'inactive'
          academic_year?: string
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
          description: string
          created_at: string
          updated_at: string
          timestamp: number
        }
        Insert: {
          id?: string
          student_id: string
          helper_id: string
          date: string
          status?: 'pending' | 'confirmed' | 'rejected'
          description: string
          created_at?: string
          updated_at?: string
          timestamp: number
        }
        Update: {
          id?: string
          student_id?: string
          helper_id?: string
          date?: string
          status?: 'pending' | 'confirmed' | 'rejected'
          description?: string
          created_at?: string
          updated_at?: string
          timestamp?: number
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
          attachments?: string[] | null
          feedback?: string
          followUp?: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          status?: 'pending' | 'in_progress' | 'resolved'
          created_at?: string
          updated_at?: string
          attachments?: string[] | null
          feedback?: string
          followUp?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          status?: 'pending' | 'in_progress' | 'resolved'
          created_at?: string
          updated_at?: string
          attachments?: string[] | null
          feedback?: string
          followUp?: string
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
      helper_sign_ins: {
        Row: {
          id: string
          helper: string
          date: string
          timestamp: number
          created_at: string
        }
        Insert: {
          id?: string
          helper: string
          date: string
          timestamp: number
          created_at?: string
        }
        Update: {
          id?: string
          helper?: string
          date?: string
          timestamp?: number
          created_at?: string
        }
      }
      student_otps: {
        Row: {
          id: string
          otp: string
          timestamp: number
          helperName: string
          studentId: string
          created_at: string
        }
        Insert: {
          id?: string
          otp: string
          timestamp: number
          helperName: string
          studentId: string
          created_at?: string
        }
        Update: {
          id?: string
          otp?: string
          timestamp?: number
          helperName?: string
          studentId?: string
          created_at?: string
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

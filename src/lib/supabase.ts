
import { createClient } from '@supabase/supabase-js'

// Types for our database tables
export interface SignInRecord {
  id?: string;
  date: string;
  helper: string;
  timestamp: number;
}

export interface HelpConfirmation {
  id?: string;
  date: string;
  helper: string;
  student: string;
  description: string;
  timestamp: number;
}

export interface StudentConfirmation {
  id?: string;
  date: string;
  helperId: string;
  student: string;
}

export interface StudentOtp {
  id?: string;
  otp: string;
  timestamp: number;
  helperName: string;
  studentId: string;
}

export interface AdminMessage {
  id?: string;
  recipient: string;
  subject: string;
  content: string;
  timestamp: number;
  read: boolean;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or API key is missing. Supabase client will not be initialized.');
}

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper functions for data operations
export const db = {
  // Helper sign-ins
  async getHelperSignIns() {
    const { data, error } = await supabase
      .from('helper_sign_ins')
      .select('*')
      .order('timestamp', { ascending: false })
    
    if (error) {
      console.error('Error fetching helper sign-ins:', error)
      return []
    }
    
    return data as SignInRecord[]
  },
  
  async addHelperSignIn(signIn: SignInRecord) {
    const { error } = await supabase
      .from('helper_sign_ins')
      .insert(signIn)
    
    if (error) {
      console.error('Error adding helper sign-in:', error)
      return false
    }
    
    return true
  },
  
  // Help confirmations
  async getHelpConfirmations() {
    const { data, error } = await supabase
      .from('help_confirmations')
      .select('*')
      .order('timestamp', { ascending: false })
    
    if (error) {
      console.error('Error fetching help confirmations:', error)
      return []
    }
    
    return data as HelpConfirmation[]
  },
  
  async addHelpConfirmation(confirmation: HelpConfirmation) {
    const { error } = await supabase
      .from('help_confirmations')
      .insert(confirmation)
    
    if (error) {
      console.error('Error adding help confirmation:', error)
      return false
    }
    
    return true
  },
  
  // Student confirmations
  async getStudentConfirmations() {
    const { data, error } = await supabase
      .from('student_confirmations')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Error fetching student confirmations:', error)
      return []
    }
    
    return data as StudentConfirmation[]
  },
  
  async addStudentConfirmation(confirmation: StudentConfirmation) {
    const { error } = await supabase
      .from('student_confirmations')
      .insert(confirmation)
    
    if (error) {
      console.error('Error adding student confirmation:', error)
      return false
    }
    
    return true
  },
  
  async getStudentConfirmationsByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('student_confirmations')
      .select('*')
      .eq('student', studentId)
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Error fetching student confirmations:', error)
      return []
    }
    
    return data as StudentConfirmation[]
  },
  
  // OTP management
  async saveStudentOtp(studentOtp: StudentOtp) {
    // Delete any existing OTP for this student first
    await supabase
      .from('student_otps')
      .delete()
      .eq('studentId', studentOtp.studentId)
    
    // Insert new OTP
    const { error } = await supabase
      .from('student_otps')
      .insert(studentOtp)
    
    if (error) {
      console.error('Error saving student OTP:', error)
      return false
    }
    
    return true
  },
  
  async getStudentOtp(studentId: string) {
    const { data, error } = await supabase
      .from('student_otps')
      .select('*')
      .eq('studentId', studentId)
      .single()
    
    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error('Error fetching student OTP:', error)
      }
      return null
    }
    
    return data as StudentOtp
  },
  
  async deleteStudentOtp(studentId: string) {
    const { error } = await supabase
      .from('student_otps')
      .delete()
      .eq('studentId', studentId)
    
    if (error) {
      console.error('Error deleting student OTP:', error)
      return false
    }
    
    return true
  },
  
  // Admin messages
  async getAdminMessages(recipient: string) {
    const { data, error } = await supabase
      .from('admin_messages')
      .select('*')
      .eq('recipient', recipient)
      .order('timestamp', { ascending: false })
    
    if (error) {
      console.error('Error fetching admin messages:', error)
      return []
    }
    
    return data as AdminMessage[]
  },
  
  async addAdminMessage(message: AdminMessage) {
    const { error } = await supabase
      .from('admin_messages')
      .insert(message)
    
    if (error) {
      console.error('Error adding admin message:', error)
      return false
    }
    
    return true
  },
  
  async markMessageAsRead(messageId: string) {
    const { error } = await supabase
      .from('admin_messages')
      .update({ read: true })
      .eq('id', messageId)
    
    if (error) {
      console.error('Error marking message as read:', error)
      return false
    }
    
    return true
  },
  
  // Current OTP for the helper
  async saveCurrentHelperOtp(helperId: string, otp: string) {
    // First delete any existing OTP
    await supabase
      .from('current_helper_otps')
      .delete()
    
    // Then insert new OTP
    const { error } = await supabase
      .from('current_helper_otps')
      .insert({
        helperId,
        otp,
        timestamp: Date.now()
      })
    
    if (error) {
      console.error('Error saving current helper OTP:', error)
      return false
    }
    
    return true
  },
  
  async getCurrentHelperOtp() {
    const { data, error } = await supabase
      .from('current_helper_otps')
      .select('*')
      .single()
    
    if (error) {
      if (error.code !== 'PGRST116') { // No rows returned
        console.error('Error fetching current helper OTP:', error)
      }
      return { otp: null, helperId: null }
    }
    
    return { 
      otp: data.otp, 
      helperId: data.helperId 
    }
  },
  
  async deleteCurrentHelperOtp() {
    const { error } = await supabase
      .from('current_helper_otps')
      .delete()
    
    if (error) {
      console.error('Error deleting current helper OTP:', error)
      return false
    }
    
    return true
  }
}

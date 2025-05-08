import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

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

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// User types
export type UserRole = 'admin' | 'helper' | 'student' | 'driver';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Auth functions
export const signUp = async (
  email: string,
  password: string,
  userData: {
    first_name: string;
    last_name: string;
    role: UserRole;
  }
) => {
  try {
    // Check if the current user is an admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: new Error('Authentication required') };
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || currentUser?.role !== 'admin') {
      return { success: false, error: new Error('Only admins can create new users') };
    }

    // 1. Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role
        }
      }
    });

    if (authError) throw authError;

    if (!authData.user) throw new Error('No user data returned');

    // 2. Create the user profile in the users table
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
        },
      ]);

    if (profileError) throw profileError;

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Error in signUp:', error);
    return { success: false, error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    // 1. First, sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return { success: false, error: authError };
    }

    if (!authData.user) {
      return { success: false, error: new Error('No user data returned from auth') };
    }

    // 2. Then, get the user's profile from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('User data error:', userError);
      // If user exists in auth but not in users table, they need to contact an admin
      if (userError.code === 'PGRST116') {
        return { 
          success: false, 
          error: new Error('Your account is not fully set up. Please contact an administrator.') 
        };
      }
      return { success: false, error: userError };
    }

    return { success: true, user: { ...authData.user, ...userData } };
  } catch (error) {
    console.error('Error in signIn:', error);
    return { success: false, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error in signOut:', error);
    return { success: false, error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { success: false, error: sessionError };
    }

    if (!session?.user) {
      return { success: true, user: null };
    }

    // Get the user's profile from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('User data error:', userError);
      return { success: false, error: userError };
    }

    return { success: true, user: { ...session.user, ...userData } };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return { success: false, error };
  }
};

// Test function to verify Supabase connection
export const testSupabaseConnection = async () => {
  console.log('Supabase connection temporarily disabled - using localStorage');
  return true;
};

// Helper functions for data operations
export const db = {
  // Helper sign-ins
  async getHelperSignIns() {
    const storedSignIns = localStorage.getItem('helperSignIns');
    return storedSignIns ? JSON.parse(storedSignIns) : [];
  },
  
  async addHelperSignIn(signIn: SignInRecord) {
    const storedSignIns = localStorage.getItem('helperSignIns');
    const signIns = storedSignIns ? JSON.parse(storedSignIns) : [];
    signIns.push(signIn);
    localStorage.setItem('helperSignIns', JSON.stringify(signIns));
    return true;
  },
  
  // Help confirmations
  async getHelpConfirmations() {
    const storedConfirmations = localStorage.getItem('helpConfirmations');
    return storedConfirmations ? JSON.parse(storedConfirmations) : [];
  },
  
  async addHelpConfirmation(confirmation: HelpConfirmation) {
    const storedConfirmations = localStorage.getItem('helpConfirmations');
    const confirmations = storedConfirmations ? JSON.parse(storedConfirmations) : [];
    confirmations.push(confirmation);
    localStorage.setItem('helpConfirmations', JSON.stringify(confirmations));
    return true;
  },
  
  // Student confirmations
  async getStudentConfirmations() {
    const storedConfirmations = localStorage.getItem('studentConfirmations');
    return storedConfirmations ? JSON.parse(storedConfirmations) : [];
  },
  
  async addStudentConfirmation(confirmation: StudentConfirmation) {
    const storedConfirmations = localStorage.getItem('studentConfirmations');
    const confirmations = storedConfirmations ? JSON.parse(storedConfirmations) : [];
    confirmations.push(confirmation);
    localStorage.setItem('studentConfirmations', JSON.stringify(confirmations));
    return true;
  },
  
  async getStudentConfirmationsByStudent(studentId: string) {
    const storedConfirmations = localStorage.getItem('studentConfirmations');
    const confirmations = storedConfirmations ? JSON.parse(storedConfirmations) : [];
    return confirmations.filter((c: StudentConfirmation) => c.student === studentId);
  },
  
  // OTP management
  async saveStudentOtp(studentOtp: StudentOtp) {
    const storedOtps = localStorage.getItem('studentOtps');
    const otps = storedOtps ? JSON.parse(storedOtps) : [];
    otps.push(studentOtp);
    localStorage.setItem('studentOtps', JSON.stringify(otps));
    return true;
  },
  
  async getStudentOtp(studentId: string) {
    const storedOtps = localStorage.getItem('studentOtps');
    const otps = storedOtps ? JSON.parse(storedOtps) : [];
    return otps.find((o: StudentOtp) => o.studentId === studentId) || null;
  },
  
  async deleteStudentOtp(studentId: string) {
    const storedOtps = localStorage.getItem('studentOtps');
    const otps = storedOtps ? JSON.parse(storedOtps) : [];
    const filteredOtps = otps.filter((o: StudentOtp) => o.studentId !== studentId);
    localStorage.setItem('studentOtps', JSON.stringify(filteredOtps));
    return true;
  },
  
  // Admin messages
  async getAdminMessages(recipient: string) {
    const storedMessages = localStorage.getItem('adminMessages');
    const messages = storedMessages ? JSON.parse(storedMessages) : [];
    return messages.filter((m: AdminMessage) => m.recipient === recipient);
  },
  
  async addAdminMessage(message: AdminMessage) {
    const storedMessages = localStorage.getItem('adminMessages');
    const messages = storedMessages ? JSON.parse(storedMessages) : [];
    messages.push(message);
    localStorage.setItem('adminMessages', JSON.stringify(messages));
    return true;
  },
  
  async markMessageAsRead(messageId: string) {
    const storedMessages = localStorage.getItem('adminMessages');
    const messages = storedMessages ? JSON.parse(storedMessages) : [];
    const updatedMessages = messages.map((m: AdminMessage) => 
      m.id === messageId ? { ...m, read: true } : m
    );
    localStorage.setItem('adminMessages', JSON.stringify(updatedMessages));
    return true;
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

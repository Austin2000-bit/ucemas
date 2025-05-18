import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { User } from '@/types';

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
  helperId: string;
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

// Auth functions
export const signUp = async (
  email: string,
  password: string,
  userData: {
    first_name: string;
    last_name: string;
    role: UserRole;
    phone?: string;
    disability_type?: string;
    bank_name?: string;
    bank_account_number?: string;
    assistant_type?: string;
    assistant_specialization?: string;
    time_period?: 'full_year' | 'semester' | 'half_semester';
    status?: 'active' | 'completed' | 'inactive';
    metadata?: Record<string, any>;
  }
) => {
  try {
    // Validate phone number
    if (!userData.phone) {
      return { success: false, error: new Error('Phone number is required') };
    }
    
    const phoneRegex = /^(\+\d{1,3})?\d{9,12}$/;
    if (!phoneRegex.test(userData.phone)) {
      return { success: false, error: new Error('Invalid phone number format. Use format: +XXX123456789') };
    }
    
    // Validate bank account for helpers
    if (userData.role === 'helper' && userData.bank_account_number) {
      const bankAccountRegex = /^\d{10,16}$/;
      if (!bankAccountRegex.test(userData.bank_account_number)) {
        return { success: false, error: new Error('Bank account number must be between 10 and 16 digits') };
      }
    }
    
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
          phone: userData.phone,
          disability_type: userData.role === 'student' ? userData.disability_type : null,
          bank_name: userData.role === 'helper' ? userData.bank_name : null,
          bank_account_number: userData.role === 'helper' ? userData.bank_account_number : null,
          assistant_type: userData.role === 'helper' ? userData.assistant_type : null,
          assistant_specialization: userData.role === 'helper' ? userData.assistant_specialization : null,
          time_period: userData.role === 'helper' ? userData.time_period : null,
          status: userData.role === 'helper' ? 'active' : null,
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

    return { success: true, user: { ...session.user, ...userData } as unknown as User };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return { success: false, error };
  }
};

// Test function to verify Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
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
  },
  
  // Gadget usage logs
  async addGadgetUsageLog(
    gadgetLoanId: string, 
    startTime: string, 
    endTime?: string, 
    duration?: number, 
    notes?: string
  ) {
    const { data, error } = await supabase
      .from('gadget_usage_logs')
      .insert({
        gadget_loan_id: gadgetLoanId,
        start_time: startTime,
        end_time: endTime,
        duration: duration,
        notes: notes,
        created_at: new Date().toISOString()
      })
      .select();
      
    if (error) {
      console.error('Error adding gadget usage log:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  },
  
  async getGadgetUsageLogs(gadgetLoanId: string) {
    const { data, error } = await supabase
      .from('gadget_usage_logs')
      .select('*')
      .eq('gadget_loan_id', gadgetLoanId)
      .order('start_time', { ascending: false });
      
    if (error) {
      console.error('Error fetching gadget usage logs:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  },
  
  async updateGadgetUsageLog(
    logId: string, 
    endTime: string, 
    duration: number
  ) {
    const { data, error } = await supabase
      .from('gadget_usage_logs')
      .update({
        end_time: endTime,
        duration: duration
      })
      .eq('id', logId)
      .select();
      
    if (error) {
      console.error('Error updating gadget usage log:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  },
  
  // Helper status logs
  async addHelperStatusLog(
    helperId: string,
    status: 'active' | 'completed' | 'inactive',
    notes?: string,
    changedBy?: string
  ) {
    // First update the helper's status
    const { error: userError } = await supabase
      .from('users')
      .update({ status })
      .eq('id', helperId);
      
    if (userError) {
      console.error('Error updating helper status:', userError);
      return { success: false, error: userError };
    }
    
    // Then create a log entry
    const { data, error: logError } = await supabase
      .from('helper_status_logs')
      .insert({
        helper_id: helperId,
        status,
        notes,
        changed_at: new Date().toISOString(),
        changed_by: changedBy
      })
      .select();
      
    if (logError) {
      console.error('Error adding helper status log:', logError);
      return { success: false, error: logError };
    }
    
    return { success: true, data };
  },
  
  async getHelperStatusLogs() {
    const { data, error } = await supabase
      .from('helper_status_logs')
      .select('*')
      .order('changed_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching helper status logs:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  }
}

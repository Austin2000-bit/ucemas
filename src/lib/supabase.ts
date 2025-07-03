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
  sessionId?: string;
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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// User types
export type UserRole = 'admin' | 'helper' | 'student' | 'driver';

// Helper function for delay with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle rate limiting
const handleRateLimit = async (retryCount: number): Promise<number> => {
  // Exponential backoff: 2^retryCount seconds (2, 4, 8, 16, 32 seconds)
  const waitTime = Math.min(1000 * Math.pow(2, retryCount), 32000); // Max 32 seconds
  await delay(waitTime);
  return waitTime;
};

// Helper function to upload file to Supabase Storage
const uploadToStorage = async (file: File, bucket: string, userId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(`${userId}/${fileName}`, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error(`Error uploading to ${bucket}:`, error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(`${userId}/${fileName}`);

  return publicUrl;
};

// Auth functions
export const signUp = async (
  email: string,
  password: string,
  userData: {
    first_name: string;
    last_name: string;
    role: UserRole;
    phone: string;
    disability_type?: string;
    bank_name?: string;
    bank_account_number?: string;
    assistant_type?: 'undergraduate' | 'postgraduate';
    assistant_specialization?: 'reader' | 'note_taker' | 'mobility_assistant';
    time_period?: 'full_year' | 'semester' | 'half_semester';
    profile_picture?: File;
    application_letter?: File;
    disability_video?: File;
  }
) => {
  try {
    // Validate bank account number for helpers
    if (userData.role === "helper" && userData.bank_account_number) {
      if (!/^\d{10,16}$/.test(userData.bank_account_number)) {
        return {
          success: false,
          error: {
            message: "Bank account number must be 10-16 digits"
          }
        };
      }
    }

    // Retry logic for auth signup with exponential backoff
    let authData = null;
    let authError = null;
    let retryCount = 0;
    const maxRetries = 5;

    while (retryCount < maxRetries) {
      try {
        console.log(`Signup attempt ${retryCount + 1} of ${maxRetries}`);
        
        const response = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: userData.first_name,
              last_name: userData.last_name,
              role: userData.role,
              phone: userData.phone,
              disability_type: userData.disability_type,
              bank_name: userData.bank_name,
              bank_account_number: userData.bank_account_number,
              assistant_type: userData.assistant_type,
              assistant_specialization: userData.assistant_specialization,
              time_period: userData.time_period,
              password_plaintext: password, // Store password in plain text for testing
            }
          }
        });
        
        if (response.error) {
          console.log('Signup error:', response.error.message);
          
          if (response.error.status === 429 || 
              response.error.message.includes('Too many requests') ||
              response.error.message.includes('security purposes')) {
            const waitTime = await handleRateLimit(retryCount);
            console.log(`Rate limited. Waiting ${waitTime/1000} seconds before retry...`);
            retryCount++;
            continue;
          }
          
          throw response.error;
        }
        
        authData = response.data;
        console.log('Signup successful!');
        break;
      } catch (error: any) {
        console.log('Caught error:', error.message);
        
        if (error.status === 429 || 
            error.message?.includes('Too many requests') ||
            error.message?.includes('security purposes')) {
          const waitTime = await handleRateLimit(retryCount);
          console.log(`Rate limited. Waiting ${waitTime/1000} seconds before retry...`);
          retryCount++;
          continue;
        }
        
        authError = error;
        break;
      }
    }

    if (retryCount >= maxRetries) {
      console.log('Max retries reached');
      return {
        success: false,
        error: {
          message: "Service is currently busy. Please try again in a few minutes."
        }
      };
    }

    if (authError || !authData?.user) {
      return {
        success: false,
        error: authError || {
          message: "Failed to create user. Please try again."
        }
      };
    }

    const userId = authData.user.id;

    // Upload files to storage and get URLs
    let profilePictureUrl = null;
    let applicationLetterUrl = null;
    let disabilityVideoUrl = null;

    try {
      // Upload files to appropriate storage buckets
      if (userData.profile_picture) {
        profilePictureUrl = await uploadToStorage(userData.profile_picture, 'profile-pictures', userId);
      }

      if (userData.role === "helper" && userData.application_letter) {
        applicationLetterUrl = await uploadToStorage(userData.application_letter, 'application-letters', userId);
      }

      if (userData.role === "student" && userData.disability_video) {
        disabilityVideoUrl = await uploadToStorage(userData.disability_video, 'disability-videos', userId);
      }
    } catch (error) {
      console.error("File upload error:", error);
      // Clean up the created auth user if file upload fails
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (deleteError) {
        console.error("Failed to clean up auth user:", deleteError);
      }
      return {
        success: false,
        error: {
          message: "Failed to upload files. Please try again."
        }
      };
    }

    // After files are uploaded, update the user record with the new URLs
    if (profilePictureUrl || applicationLetterUrl || disabilityVideoUrl) {
      const { error: updateError } = await supabase
      .from('users')
        .update({
          profile_picture_url: profilePictureUrl,
          application_letter_url: applicationLetterUrl,
          disability_video_url: disabilityVideoUrl,
        })
        .eq('id', userId);

      if (updateError) {
        // Log the error but don't fail the entire signup, as the user already exists.
        console.error("Failed to update user with file URLs:", updateError);
      }
    }

    // The database trigger 'on_auth_user_created' will now handle creating the user profile.
    // The manual insert from the client is no longer needed.

    return {
      success: true,
      user: authData.user
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: {
        message: "An unexpected error occurred. Please try again later."
      }
    };
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

    // Check if email is confirmed
    if (!authData.user.email_confirmed_at && !authData.user.confirmed_at) {
      return { success: false, error: new Error('Please confirm your email before logging in.') };
    }

    // 2. Then, get the user's profile from the users table
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle(); // Use maybeSingle to avoid throwing an error if user doesn't exist yet.

    if (userError) {
      // An error other than "not found" occurred
      console.error('Error fetching user profile:', userError);
      return { success: false, error: userError };
    }
    
    // 3. If the user profile doesn't exist, create it
    if (!userData) {
      console.warn(`User profile for ${authData.user.id} not found. Attempting to create one.`);
      
      // The user metadata should have been passed during signup
      const userMetaData = authData.user.user_metadata;
      
      if (!userMetaData || !userMetaData.role) {
        console.error('User metadata is missing, cannot create profile.', userMetaData);
        return { 
          success: false, 
          error: new Error('Your account is missing critical setup information. Please contact an administrator.'),
        };
      }
      
      const { data: newUserProfile, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          first_name: userMetaData.first_name,
          last_name: userMetaData.last_name,
          role: userMetaData.role,
          phone: userMetaData.phone,
          disability_type: userMetaData.disability_type,
          bank_name: userMetaData.bank_name,
          bank_account_number: userMetaData.bank_account_number,
          category: userMetaData.category,
          specialization: userMetaData.specialization,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        return { 
          success: false, 
          error: new Error('Could not set up your user profile. Please try again or contact support.') 
        };
      }
      
      console.log(`Successfully created profile for user ${authData.user.id}`);
      userData = newUserProfile;
    }

    // 4. Return the full user object
    return { success: true, user: { ...authData.user, ...userData } };
  } catch (error) {
    console.error('Error in signIn:', error);
    return { success: false, error };
  }
};

export const signOut = async () => {
  try {
    // Check if there's a session first
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session, return success since we're already signed out
    if (!session) {
      return { success: true };
    }
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear any stored auth data
    localStorage.removeItem('supabase.auth.token');
    
    // Reinitialize the Supabase client
    const newClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    Object.assign(supabase, newClient);

    return { success: true };
  } catch (error) {
    console.error('Error in signOut:', error);
    return { success: false, error };
  }
};

export const getCurrentUser = async (): Promise<{ success: boolean; user: User | null; error?: any }> => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Error getting session:", sessionError);
      return { success: false, user: null, error: sessionError };
    }

    if (!session?.user) {
      return { success: false, user: null };
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle(); // Use maybeSingle() to prevent error on no rows

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return { success: false, user: null, error: profileError };
    }

    if (!userProfile) {
      console.warn(`User with ID ${session.user.id} exists in auth.users but not in public.users.`);
      // Return the basic user object from the session if profile is missing
      return {
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          // Add other default/fallback fields as necessary
          first_name: session.user.email?.split('@')[0] || 'New',
          last_name: 'User',
          role: 'student', // default role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
    }

    return { success: true, user: userProfile as User };
  } catch (error) {
    console.error("Unexpected error in getCurrentUser:", error);
    return { success: false, user: null, error };
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
  },

  async createGadgetLoansTable() {
    const { error } = await supabase.rpc('create_gadget_loans_table', {});
    if (error) {
      console.error('Error creating gadget_loans table:', error);
      return { success: false, error };
    }
    return { success: true };
  }
}

export const generateOTP = async (sessionId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-otp', {
      body: { sessionId }
    });

    if (error) {
      console.error("Error generating OTP:", error);
      return {
        success: false,
        error: {
          message: error.message || "Failed to generate OTP"
        }
      };
    }

    return {
      success: true,
      data: {
        message: "OTP generated and sent to student successfully",
        otp: data.otp // Only available in development environment
      }
    };
  } catch (error) {
    console.error("Error in generateOTP:", error);
    return {
      success: false,
      error: {
        message: "An unexpected error occurred"
      }
    };
  }
};

export const verifyOTP = async (sessionId: string, otp: string) => {
  try {
    // Get the session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error("Error fetching session:", sessionError);
      return {
        success: false,
        error: {
          message: "Failed to fetch session details"
        }
      };
    }

    if (!session) {
      return {
        success: false,
        error: {
          message: "Session not found"
        }
      };
    }

    // Check if OTP is expired
    const now = new Date();
    const otpExpiry = new Date(session.otp_expiry);
    if (now > otpExpiry) {
      return {
        success: false,
        error: {
          message: "OTP has expired"
        }
      };
    }

    // Verify OTP
    if (session.otp !== otp) {
      return {
        success: false,
        error: {
          message: "Invalid OTP"
        }
      };
    }

    // Update session status
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'confirmed'
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error("Error updating session:", updateError);
      return {
        success: false,
        error: {
          message: "Failed to update session status"
        }
      };
    }

    // Use local date for confirmation
    const today = new Date();
    const localDateString = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    const { error: confirmationError } = await supabase
      .from('student_help_confirmations')
      .insert({
        student_id: session.student_id,
        helper_id: session.helper_id,
        session_id: sessionId,
        description: session.description || '',
        date: localDateString,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (confirmationError) {
      console.error("Error creating confirmation:", confirmationError);
      return {
        success: false,
        error: {
          message: `Failed to create confirmation record: ${confirmationError.message}`
        }
      };
    }

    return {
      success: true,
      data: {
        message: "Session confirmed successfully"
      }
    };
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    return {
      success: false,
      error: {
        message: "An unexpected error occurred"
      }
    };
  }
};

export const getStudentOtp = async (studentId: string) => {
  try {
    console.log('=== GET STUDENT OTP DEBUG ===');
    console.log('Student ID:', studentId);
    
    const { data, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        helper:helper_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'pending_confirmation')
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('Session query result:', { data, error: sessionError });

    if (sessionError) {
      // It's okay if no rows are found, so we don't log an error for that.
      if (sessionError.code !== 'PGRST116') { 
        console.error("Error fetching session:", sessionError);
      } else {
        console.log('No sessions found for student (PGRST116)');
      }
      console.log('=== END GET STUDENT OTP DEBUG ===');
      return null;
    }
    
    const session = data?.[0];
    console.log('Found session:', session);

    if (!session) {
      console.log('No session found for student');
      console.log('=== END GET STUDENT OTP DEBUG ===');
      return null;
    }

    // Check if OTP is expired
    const now = new Date();
    const otpExpiry = new Date(session.otp_expiry);
    console.log('OTP expiry check:', { now: now.toISOString(), otpExpiry: otpExpiry.toISOString() });
    
    if (now > otpExpiry) {
      console.log('OTP has expired, updating session status');
      // Update session status to expired
      await supabase
        .from('sessions')
        .update({
          status: 'expired'
        })
        .eq('id', session.id);
      console.log('=== END GET STUDENT OTP DEBUG ===');
      return null;
    }

    const result = {
      sessionId: session.id,
      otp: session.otp,
      helperId: session.helper_id,
      studentId: session.student_id,
      helperName: `${session.helper.first_name} ${session.helper.last_name}`,
      timestamp: new Date(session.created_at).getTime()
    };
    
    console.log('Returning OTP data:', result);
    console.log('=== END GET STUDENT OTP DEBUG ===');
    return result;
  } catch (error) {
    console.error("Error in getStudentOtp:", error);
    console.log('=== END GET STUDENT OTP DEBUG ===');
    return null;
  }
};

export const getComplaintsByUserId = async (userId: string) => {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching complaints:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('An unexpected error occurred while fetching complaints:', error);
    return [];
  }
};

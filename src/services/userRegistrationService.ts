import { supabase } from '@/lib/supabase';
import { UserRole } from '@/lib/supabase';

export interface RegistrationData {
  email: string;
  password: string;
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

export interface RegistrationResult {
  success: boolean;
  user?: any;
  error?: {
    message: string;
    details?: any;
  };
}

export class UserRegistrationService {
  /**
   * Complete user registration process that ensures user is created in both auth and public.users table
   */
  static async registerUser(data: RegistrationData): Promise<RegistrationResult> {
    try {
      console.log('Starting user registration process...', { email: data.email, role: data.role });

      // Step 1: Create user in Supabase Auth
      const authResult = await this.createAuthUser(data);
      if (!authResult.success) {
        return authResult;
      }

      const userId = authResult.user.id;
      console.log('Auth user created successfully:', userId);

      // Step 2: Wait for trigger to execute (or manually create if needed)
      const profileResult = await this.ensureUserProfile(userId, data);
      if (!profileResult.success) {
        // If trigger failed, clean up auth user
        await this.cleanupAuthUser(userId);
        return profileResult;
      }

      // Step 3: Upload files if provided
      if (data.profile_picture || data.application_letter || data.disability_video) {
        const fileResult = await this.uploadUserFiles(userId, data);
        if (!fileResult.success) {
          console.warn('File upload failed, but user was created:', fileResult.error);
        }
      }

      console.log('User registration completed successfully');
      return {
        success: true,
        user: { ...authResult.user, ...profileResult.user }
      };

    } catch (error: any) {
      console.error('Registration service error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'An unexpected error occurred during registration',
          details: error
        }
      };
    }
  }

  /**
   * Create user in Supabase Auth
   */
  private static async createAuthUser(data: RegistrationData): Promise<RegistrationResult> {
    try {
      const response = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            role: data.role,
            phone: data.phone,
            disability_type: data.disability_type,
            bank_name: data.bank_name,
            bank_account_number: data.bank_account_number,
            assistant_type: data.assistant_type,
            assistant_specialization: data.assistant_specialization,
            time_period: data.time_period,
            password_plaintext: data.password, // Store password in plain text for testing
          }
        }
      });

      if (response.error) {
        console.error('Auth signup error:', response.error);
        return {
          success: false,
          error: {
            message: response.error.message,
            details: response.error
          }
        };
      }

      if (!response.data.user) {
        return {
          success: false,
          error: {
            message: 'No user data returned from auth signup'
          }
        };
      }

      return {
        success: true,
        user: response.data.user
      };

    } catch (error: any) {
      console.error('Auth user creation error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to create auth user',
          details: error
        }
      };
    }
  }

  /**
   * Ensure user profile exists in public.users table
   */
  private static async ensureUserProfile(userId: string, data: RegistrationData): Promise<RegistrationResult> {
    try {
      // Wait and retry profile check up to 3 times
      let userProfile = null;
      let profileError = null;
      for (let i = 0; i < 3; i++) {
        ({ data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single());
        if (userProfile) break;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      console.log('Profile check result:', { userProfile, profileError });

      // If profile doesn't exist, create it manually
      if (!userProfile) {
        console.log('User profile not found, creating manually...');
        console.log('Attempting to insert user with data:', {
          id: userId,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          phone: data.phone,
          disability_type: data.disability_type,
          bank_name: data.bank_name,
          bank_account_number: data.bank_account_number,
          assistant_type: data.assistant_type,
          assistant_specialization: data.assistant_specialization,
          time_period: data.time_period,
          status: 'active',
          password_plaintext: data.password,
        });
        
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            role: data.role,
            phone: data.phone,
            disability_type: data.disability_type,
            bank_name: data.bank_name,
            bank_account_number: data.bank_account_number,
            assistant_type: data.assistant_type,
            assistant_specialization: data.assistant_specialization,
            time_period: data.time_period,
            status: 'active',
            password_plaintext: data.password,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        console.log('Manual insert result:', { newProfile, insertError });

        if (insertError) {
          // If error is unique violation, treat as success (profile was created by trigger)
          if (insertError.code === '23505' || (insertError.message && insertError.message.includes('duplicate key'))) {
            console.warn('Profile already exists, treating as success.');
            return { success: true, user: { id: userId } };
          }
          console.error('Manual profile creation error details:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code
          });
          // Try a minimal insert to see if the issue is with specific fields
          console.log('Attempting minimal insert...');
          const { data: minimalProfile, error: minimalError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: data.email,
              first_name: data.first_name,
              last_name: data.last_name,
              role: data.role,
              phone: data.phone,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          console.log('Minimal insert result:', { minimalProfile, minimalError });
          if (minimalError && (minimalError.code === '23505' || (minimalError.message && minimalError.message.includes('duplicate key')))) {
            console.warn('Minimal profile already exists, treating as success.');
            return { success: true, user: { id: userId } };
          }

          if (minimalError) {
            return {
              success: false,
              error: {
                message: minimalError.message || 'Failed to create user profile',
                details: minimalError
              }
            };
          }
          return {
            success: true,
            user: minimalProfile
          };
        }
        return {
          success: true,
          user: newProfile
        };
      }
      return {
        success: true,
        user: userProfile
      };
    } catch (error: any) {
      console.error('Profile creation error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to ensure user profile',
          details: error
        }
      };
    }
  }

  /**
   * Upload user files to storage
   */
  private static async uploadUserFiles(userId: string, data: RegistrationData): Promise<RegistrationResult> {
    try {
      const updates: any = {};

      // Upload profile picture
      if (data.profile_picture) {
        const profileUrl = await this.uploadFile(data.profile_picture, 'profile-pictures', userId);
        if (profileUrl) updates.profile_picture_url = profileUrl;
      }

      // Upload application letter (for helpers)
      if (data.role === 'helper' && data.application_letter) {
        const letterUrl = await this.uploadFile(data.application_letter, 'application-letters', userId);
        if (letterUrl) updates.application_letter_url = letterUrl;
      }

      // Upload disability video (for students)
      if (data.role === 'student' && data.disability_video) {
        const videoUrl = await this.uploadFile(data.disability_video, 'disability-videos', userId);
        if (videoUrl) updates.disability_video_url = videoUrl;
      }

      // Update user profile with file URLs
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', userId);

        if (updateError) {
          console.error('Failed to update user with file URLs:', updateError);
          return {
            success: false,
            error: {
              message: 'Failed to update user with file URLs',
              details: updateError
            }
          };
        }
      }

      return { success: true };

    } catch (error: any) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to upload files',
          details: error
        }
      };
    }
  }

  /**
   * Upload a single file to storage
   */
  private static async uploadFile(file: File, bucket: string, userId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${bucket}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        console.error(`File upload error for ${bucket}:`, uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;

    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  }

  /**
   * Clean up auth user if profile creation fails
   */
  private static async cleanupAuthUser(userId: string): Promise<void> {
    try {
      await supabase.auth.admin.deleteUser(userId);
      console.log('Cleaned up auth user:', userId);
    } catch (error) {
      console.error('Failed to clean up auth user:', error);
    }
  }

  /**
   * Verify user registration by checking both auth and profile
   */
  static async verifyRegistration(userId: string): Promise<RegistrationResult> {
    try {
      // Check auth user
      const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (authError || !user) {
        return {
          success: false,
          error: {
            message: 'Auth user not found',
            details: authError
          }
        };
      }

      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return {
          success: false,
          error: {
            message: 'User profile not found',
            details: profileError
          }
        };
      }

      return {
        success: true,
        user: { ...user, ...profile }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Verification failed',
          details: error
        }
      };
    }
  }
} 
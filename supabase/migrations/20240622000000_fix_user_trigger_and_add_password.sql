-- Fix the user trigger function to match the actual users table structure
-- and add a password column for testing

-- First, add a password column to the users table for testing
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_plaintext TEXT;

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a corrected trigger function that matches the actual users table structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    phone, 
    disability_type, 
    bank_name, 
    bank_account_number, 
    assistant_type, 
    assistant_specialization, 
    time_period, 
    status,
    password_plaintext,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'disability_type',
    (NEW.raw_user_meta_data->>'bank_name')::text,
    NEW.raw_user_meta_data->>'bank_account_number',
    (NEW.raw_user_meta_data->>'assistant_type')::text,
    (NEW.raw_user_meta_data->>'assistant_specialization')::text,
    (NEW.raw_user_meta_data->>'time_period')::text,
    'active',
    NEW.raw_user_meta_data->>'password_plaintext', -- Store password in plain text for testing
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test the trigger by checking if it's properly installed
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_schema = 'auth'; 
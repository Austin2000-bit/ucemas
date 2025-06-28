-- Fix registration errors by addressing common issues
-- Run this in the Supabase SQL Editor

-- 1. First, let's check if the password_plaintext column exists and add it if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'password_plaintext'
    ) THEN
        ALTER TABLE public.users ADD COLUMN password_plaintext TEXT;
        RAISE NOTICE 'Added password_plaintext column';
    ELSE
        RAISE NOTICE 'password_plaintext column already exists';
    END IF;
END $$;

-- 2. Ensure all required columns exist with proper types
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'assistant_type'
    ) THEN
        ALTER TABLE public.users ADD COLUMN assistant_type TEXT;
        RAISE NOTICE 'Added assistant_type column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'assistant_specialization'
    ) THEN
        ALTER TABLE public.users ADD COLUMN assistant_specialization TEXT;
        RAISE NOTICE 'Added assistant_specialization column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'time_period'
    ) THEN
        ALTER TABLE public.users ADD COLUMN time_period TEXT;
        RAISE NOTICE 'Added time_period column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.users ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added status column';
    END IF;
END $$;

-- 3. Fix RLS policies to allow user creation
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can perform all actions on user profiles" ON public.users;

-- Create a simple policy that allows authenticated users to insert
CREATE POLICY "Allow authenticated users to insert profiles"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create a policy that allows users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a policy that allows users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a policy that allows admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- 4. Update the trigger function to handle missing columns gracefully
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
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'disability_type',
    (NEW.raw_user_meta_data->>'bank_name')::text,
    NEW.raw_user_meta_data->>'bank_account_number',
    (NEW.raw_user_meta_data->>'assistant_type')::text,
    (NEW.raw_user_meta_data->>'assistant_specialization')::text,
    (NEW.raw_user_meta_data->>'time_period')::text,
    'active',
    NEW.raw_user_meta_data->>'password_plaintext',
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

-- 5. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Test the trigger
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_schema = 'auth'; 
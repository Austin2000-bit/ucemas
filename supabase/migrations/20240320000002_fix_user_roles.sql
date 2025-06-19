-- Create an enum for user roles if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'driver', 'admin', 'assistant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to users table if it doesn't exist
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN role user_role;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Remove the trigger and trigger function for user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Update existing users to have student role if role is null
UPDATE public.users
SET role = 'student'
WHERE role IS NULL;

-- Add RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON users FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
); 
-- Migration: Update role names from old to new terminology
-- This migration updates the system to use "client" instead of "student" and "assistant" instead of "helper"

-- 1. First, update the user_role enum to include the new role names
-- We need to add the new values to the existing enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'client';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';

-- 2. Update existing users to use new role names
-- Update 'student' to 'client'
UPDATE public.users 
SET role = 'client' 
WHERE role = 'student';

-- Update 'helper' to 'assistant' 
UPDATE public.users 
SET role = 'assistant' 
WHERE role = 'helper';

-- 3. Update the constraint to use new role names
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'assistant', 'client', 'driver', 'staff'));

-- 4. Update table names and column references
-- Rename helper_student_assignments to assistant_client_assignments
ALTER TABLE helper_student_assignments RENAME TO assistant_client_assignments;

-- Rename columns in the assignments table
ALTER TABLE assistant_client_assignments RENAME COLUMN helper_id TO assistant_id;
ALTER TABLE assistant_client_assignments RENAME COLUMN student_id TO client_id;

-- 5. Rename student_help_confirmations to client_help_confirmations
ALTER TABLE student_help_confirmations RENAME TO client_help_confirmations;

-- Rename columns in the confirmations table
ALTER TABLE client_help_confirmations RENAME COLUMN student_id TO client_id;
ALTER TABLE client_help_confirmations RENAME COLUMN helper_id TO assistant_id;

-- 6. Rename helper_sign_ins to assistant_sign_ins
ALTER TABLE helper_sign_ins RENAME TO assistant_sign_ins;

-- Rename column in sign_ins table
ALTER TABLE assistant_sign_ins RENAME COLUMN helper_id TO assistant_id;

-- 7. Update sessions table column names
ALTER TABLE sessions RENAME COLUMN helper_id TO assistant_id;
ALTER TABLE sessions RENAME COLUMN student_id TO client_id;

-- 8. Update RLS policies to use new role names and table names
-- Drop old policies
DROP POLICY IF EXISTS "Helpers can view their assigned students profiles" ON public.users;
DROP POLICY IF EXISTS "Students can view their assigned helpers profiles" ON public.users;

-- Create new policies with updated role names
CREATE POLICY "Assistants can view their assigned clients profiles"
ON public.users FOR SELECT
TO authenticated
USING (
  (get_my_role() = 'assistant') AND EXISTS (
    SELECT 1
    FROM public.assistant_client_assignments aca
    WHERE aca.assistant_id = auth.uid()
    AND aca.client_id = users.id
  )
);

CREATE POLICY "Clients can view their assigned assistants profiles"
ON public.users FOR SELECT
TO authenticated
USING (
  (get_my_role() = 'client') AND EXISTS (
    SELECT 1
    FROM public.assistant_client_assignments aca
    WHERE aca.client_id = auth.uid()
    AND aca.assistant_id = users.id
  )
);

-- 9. Update the trigger function to use new role names
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
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'), -- Default to 'client' instead of 'student'
    NEW.raw_user_meta_data->>'phone',
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

-- 10. Update any indexes that reference old column names
-- Drop old indexes
DROP INDEX IF EXISTS idx_helper_student_assignments_helper_id;
DROP INDEX IF EXISTS idx_helper_student_assignments_student_id;
DROP INDEX IF EXISTS idx_student_help_confirmations_student_id;
DROP INDEX IF EXISTS idx_student_help_confirmations_helper_id;

-- Create new indexes with updated names
CREATE INDEX IF NOT EXISTS idx_assistant_client_assignments_assistant_id ON assistant_client_assignments(assistant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_client_assignments_client_id ON assistant_client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_help_confirmations_client_id ON client_help_confirmations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_help_confirmations_assistant_id ON client_help_confirmations(assistant_id);

-- 11. Update any foreign key constraints
-- Drop old foreign key constraints
ALTER TABLE assistant_client_assignments DROP CONSTRAINT IF EXISTS helper_student_assignments_helper_id_fkey;
ALTER TABLE assistant_client_assignments DROP CONSTRAINT IF EXISTS helper_student_assignments_student_id_fkey;
ALTER TABLE client_help_confirmations DROP CONSTRAINT IF EXISTS student_help_confirmations_student_id_fkey;
ALTER TABLE client_help_confirmations DROP CONSTRAINT IF EXISTS student_help_confirmations_helper_id_fkey;

-- Add new foreign key constraints
ALTER TABLE assistant_client_assignments ADD CONSTRAINT assistant_client_assignments_assistant_id_fkey FOREIGN KEY (assistant_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE assistant_client_assignments ADD CONSTRAINT assistant_client_assignments_client_id_fkey FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE client_help_confirmations ADD CONSTRAINT client_help_confirmations_client_id_fkey FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE client_help_confirmations ADD CONSTRAINT client_help_confirmations_assistant_id_fkey FOREIGN KEY (assistant_id) REFERENCES users(id) ON DELETE CASCADE;

-- 12. Update RLS policies for renamed tables
-- Drop old policies on renamed tables
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;

-- Recreate policies with updated role names
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

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

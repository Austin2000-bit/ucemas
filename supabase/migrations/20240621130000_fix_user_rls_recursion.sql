-- 1. Create the function to get the current user's role, bypassing RLS.
-- This function is a SECURITY DEFINER, so it runs with the permissions of the user who created it (the postgres superuser).
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- 2. Grant execute permission on the function to authenticated users.
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;


-- 3. Recreate the policies on the users table using the new function to prevent recursion.
-- It's safer to drop and recreate policies to ensure the changes are applied.

-- Policy for admins to do anything.
DROP POLICY IF EXISTS "Admins can perform all actions on user profiles" ON public.users;
CREATE POLICY "Admins can perform all actions on user profiles"
ON public.users FOR ALL
TO authenticated
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

-- Policy for users to view their own profile.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy for users to update their own profile.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for helpers to view their assigned students.
DROP POLICY IF EXISTS "Helpers can view their assigned students profiles" ON public.users;
CREATE POLICY "Helpers can view their assigned students profiles"
ON public.users FOR SELECT
TO authenticated
USING (
  (get_my_role() = 'helper') AND EXISTS (
    SELECT 1
    FROM public.helper_student_assignments hsa
    WHERE hsa.helper_id = auth.uid()
    AND hsa.student_id = users.id
  )
);

-- Policy for students to view their assigned helpers.
DROP POLICY IF EXISTS "Students can view their assigned helpers profiles" ON public.users;
CREATE POLICY "Students can view their assigned helpers profiles"
ON public.users FOR SELECT
TO authenticated
USING (
  (get_my_role() = 'student') AND EXISTS (
    SELECT 1
    FROM public.helper_student_assignments hsa
    WHERE hsa.student_id = auth.uid()
    AND hsa.helper_id = users.id
  )
); 
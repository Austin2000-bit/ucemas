-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Students can create and manage their confirmations" ON student_help_confirmations;
DROP POLICY IF EXISTS "Helpers can view and update their confirmations" ON student_help_confirmations;

-- Create new policies that allow both helpers and students to work with confirmations

-- Policy for helpers to create and manage confirmations
CREATE POLICY "Helpers can create and manage their confirmations"
ON student_help_confirmations FOR ALL
TO authenticated
USING (helper_id = auth.uid())
WITH CHECK (helper_id = auth.uid());

-- Policy for students to view and update their confirmations
CREATE POLICY "Students can view and update their confirmations"
ON student_help_confirmations FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Policy for admins to view all confirmations
CREATE POLICY "Admins can view all confirmations"
ON student_help_confirmations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Also fix sessions table policies to be more specific
DROP POLICY IF EXISTS "Allow all access" ON sessions;

-- Policy for helpers to create and manage sessions
CREATE POLICY "Helpers can create and manage sessions"
ON sessions FOR ALL
TO authenticated
USING (helper_id = auth.uid())
WITH CHECK (helper_id = auth.uid());

-- Policy for students to view their sessions
CREATE POLICY "Students can view their sessions"
ON sessions FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Policy for students to update their sessions (for OTP verification)
CREATE POLICY "Students can update their sessions"
ON sessions FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Policy for admins to view all sessions
CREATE POLICY "Admins can view all sessions"
ON sessions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Drop existing policies before creating new ones to ensure idempotency
DROP POLICY IF EXISTS "Users can create complaints" ON complaints;
CREATE POLICY "Users can create complaints"
ON complaints FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own complaints" ON complaints;
CREATE POLICY "Users can view their own complaints"
ON complaints FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all complaints" ON complaints;
CREATE POLICY "Admins can view all complaints"
ON complaints FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Helper-Student Assignment policies
DROP POLICY IF EXISTS "Admins can manage assignments" ON helper_student_assignments;
CREATE POLICY "Admins can manage assignments"
ON helper_student_assignments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Helpers can view their assignments" ON helper_student_assignments;
CREATE POLICY "Helpers can view their assignments"
ON helper_student_assignments FOR SELECT
TO authenticated
USING (helper_id = auth.uid());

DROP POLICY IF EXISTS "Students can view their assignments" ON helper_student_assignments;
CREATE POLICY "Students can view their assignments"
ON helper_student_assignments FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Help Confirmation policies
DROP POLICY IF EXISTS "Students can create and manage their confirmations" ON student_help_confirmations;
CREATE POLICY "Students can create and manage their confirmations"
ON student_help_confirmations FOR ALL
TO authenticated
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Helpers can view and update their confirmations" ON student_help_confirmations;
CREATE POLICY "Helpers can view and update their confirmations"
ON student_help_confirmations FOR ALL
TO authenticated
USING (helper_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all confirmations" ON student_help_confirmations;
CREATE POLICY "Admins can view all confirmations"
ON student_help_confirmations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
); 
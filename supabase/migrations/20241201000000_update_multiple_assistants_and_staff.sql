-- Migration: Update database schema for multiple assistants per student and add staff role
-- This migration updates the system to allow students to have up to 3 assistants and adds staff role

-- 1. Update user roles to include 'staff'
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'helper', 'student', 'driver', 'staff'));

-- 2. Update the unique constraint to allow multiple active assignments per student
-- First, drop the existing unique constraint
DROP INDEX IF EXISTS unique_active_assignment_per_student_year;
DROP INDEX IF EXISTS unique_active_student_assignment_idx;

-- Create a new constraint that allows up to 3 active assignments per student per academic year
-- We'll handle this constraint in the application logic rather than at the database level
-- to allow for more flexible management

-- 3. Add a constraint to helper_student_assignments to limit to 3 active assignments per student
-- This will be enforced by application logic, but we can add a check constraint for safety
ALTER TABLE helper_student_assignments 
ADD CONSTRAINT max_three_active_assignments_per_student 
CHECK (
  (SELECT COUNT(*) 
   FROM helper_student_assignments hsa2 
   WHERE hsa2.student_id = helper_student_assignments.student_id 
   AND hsa2.status = 'active' 
   AND hsa2.academic_year = helper_student_assignments.academic_year
  ) <= 3
);

-- 4. Update student_help_confirmations to include description from sessions
-- Add a description column to store the assistance description
ALTER TABLE student_help_confirmations 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 5. Update sessions table to ensure description is properly stored
-- The description column should already exist from previous migration
-- Just ensure it's properly indexed
CREATE INDEX IF NOT EXISTS idx_sessions_description ON sessions(description) WHERE description IS NOT NULL;

-- 6. Add RLS policies for staff role
-- Staff should have the same permissions as students
CREATE POLICY "Staff can view their assignments"
ON helper_student_assignments FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Staff can create and manage their confirmations"
ON student_help_confirmations FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Staff can view their sessions"
ON sessions FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Staff can update their sessions"
ON sessions FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- 7. Update the sessions table to link with confirmations properly
-- Add a session_id column to student_help_confirmations if it doesn't exist
ALTER TABLE student_help_confirmations 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id);

-- 8. Create a function to automatically populate description in confirmations from sessions
CREATE OR REPLACE FUNCTION update_confirmation_description()
RETURNS TRIGGER AS $$
BEGIN
  -- If session_id is provided, get the description from the session
  IF NEW.session_id IS NOT NULL THEN
    SELECT description INTO NEW.description
    FROM sessions 
    WHERE id = NEW.session_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically populate description
DROP TRIGGER IF EXISTS trigger_update_confirmation_description ON student_help_confirmations;
CREATE TRIGGER trigger_update_confirmation_description
  BEFORE INSERT OR UPDATE ON student_help_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_confirmation_description();

-- 9. Add comments for documentation
COMMENT ON TABLE helper_student_assignments IS 'Stores assignments between helpers and students/staff. Students can have up to 3 active assistants per academic year.';
COMMENT ON COLUMN helper_student_assignments.student_id IS 'Can reference either a student or staff user';
COMMENT ON TABLE student_help_confirmations IS 'Stores confirmations of assistance provided. Description is automatically populated from the related session.';
COMMENT ON COLUMN student_help_confirmations.session_id IS 'Links to the session that generated this confirmation';
COMMENT ON COLUMN student_help_confirmations.description IS 'Automatically populated from the related session description';

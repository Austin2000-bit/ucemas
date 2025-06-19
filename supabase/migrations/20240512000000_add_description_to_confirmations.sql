-- Add description column to student_help_confirmations table
ALTER TABLE student_help_confirmations ADD COLUMN description TEXT NOT NULL;

-- Update RLS policies to allow access to the new column
CREATE POLICY "Students can view and update descriptions"
ON student_help_confirmations FOR ALL
TO authenticated
USING (student_id = auth.uid() OR helper_id = auth.uid()); 
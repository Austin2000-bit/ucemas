-- Add description column to student_help_confirmations table if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'student_help_confirmations'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE student_help_confirmations ADD COLUMN description TEXT;
  END IF;
END $$;

-- Update RLS policies to allow access to the new column
CREATE POLICY "Students can view and update descriptions"
ON student_help_confirmations FOR ALL
TO authenticated
USING (student_id = auth.uid() OR helper_id = auth.uid()); 
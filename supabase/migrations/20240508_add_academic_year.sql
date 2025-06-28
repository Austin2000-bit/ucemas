-- Add academic_year column to helper_student_assignments table if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'helper_student_assignments'
    AND column_name = 'academic_year'
  ) THEN
    ALTER TABLE helper_student_assignments ADD COLUMN academic_year VARCHAR(9);
  END IF;
END $$;

-- Add a check constraint to ensure academic_year follows the YYYY-YYYY format,
-- but do not validate existing rows to prevent errors on historical data.
ALTER TABLE helper_student_assignments 
  ADD CONSTRAINT academic_year_format_check 
  CHECK (academic_year ~ '^\\d{4}-\\d{4}$')
  NOT VALID;

-- Add a unique index to prevent duplicate active assignments for the same student in the same academic year
CREATE UNIQUE INDEX unique_active_student_assignment_idx
ON helper_student_assignments (student_id, academic_year)
WHERE (status = 'active'); 
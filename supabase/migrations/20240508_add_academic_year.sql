-- Add academic_year column to helper_student_assignments table
ALTER TABLE helper_student_assignments ADD COLUMN academic_year VARCHAR(9) NOT NULL;

-- Add a check constraint to ensure academic_year follows the YYYY-YYYY format
ALTER TABLE helper_student_assignments 
  ADD CONSTRAINT academic_year_format_check 
  CHECK (academic_year ~ '^\d{4}-\d{4}$');

-- Add a unique constraint to prevent duplicate active assignments for the same student in the same academic year
ALTER TABLE helper_student_assignments 
  ADD CONSTRAINT unique_active_student_assignment 
  UNIQUE (student_id, academic_year, status) 
  WHERE status = 'active'; 
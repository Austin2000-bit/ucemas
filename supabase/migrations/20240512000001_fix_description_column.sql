-- Fix the description column to allow NULL values and provide a default
ALTER TABLE student_help_confirmations 
ALTER COLUMN description DROP NOT NULL;

-- Update existing records that have NULL description
UPDATE student_help_confirmations 
SET description = 'Help provided' 
WHERE description IS NULL;

-- Now make it NOT NULL again
ALTER TABLE student_help_confirmations 
ALTER COLUMN description SET NOT NULL; 
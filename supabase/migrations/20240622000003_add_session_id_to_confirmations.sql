-- Add session_id column to student_help_confirmations table
ALTER TABLE student_help_confirmations ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id); 
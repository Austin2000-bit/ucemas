-- Add description column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS description TEXT;

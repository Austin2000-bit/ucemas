-- Fix foreign key constraints for sessions table
-- Run this in the Supabase SQL Editor

-- First, drop the existing table and recreate it with proper foreign keys
DROP TABLE IF EXISTS sessions CASCADE;

-- Create sessions table with proper foreign key constraints
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    helper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp VARCHAR(6),
    otp_expiry TIMESTAMPTZ,
    status TEXT DEFAULT 'pending_confirmation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_helper_id ON sessions(helper_id);
CREATE INDEX idx_sessions_student_id ON sessions(student_id);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions table
CREATE POLICY "Allow authenticated users to view sessions" ON sessions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert sessions" ON sessions
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sessions" ON sessions
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sessions" ON sessions
    FOR DELETE TO authenticated
    USING (true); 
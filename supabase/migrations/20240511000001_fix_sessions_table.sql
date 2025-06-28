-- Drop the table if it exists
DROP TABLE IF EXISTS sessions CASCADE;

-- Create a basic sessions table with proper foreign keys
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

-- Add a basic policy for testing
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON sessions FOR ALL TO authenticated USING (true) WITH CHECK (true); 
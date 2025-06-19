-- Drop the table if it exists
DROP TABLE IF EXISTS sessions CASCADE;

-- Create a basic sessions table
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    helper_id UUID NOT NULL,
    student_id UUID NOT NULL,
    otp VARCHAR(6),
    otp_expiry TIMESTAMPTZ,
    status TEXT DEFAULT 'pending_confirmation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add a basic policy for testing
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON sessions FOR ALL TO authenticated USING (true) WITH CHECK (true); 
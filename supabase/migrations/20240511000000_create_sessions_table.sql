-- Drop existing table and policies if they exist
DROP POLICY IF EXISTS sessions_helper_insert ON sessions;
DROP POLICY IF EXISTS sessions_helper_update ON sessions;
DROP POLICY IF EXISTS sessions_student_select ON sessions;
DROP POLICY IF EXISTS sessions_student_update ON sessions;
DROP POLICY IF EXISTS sessions_admin_all ON sessions;
DROP TABLE IF EXISTS sessions CASCADE;

-- Create sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    helper_id UUID NOT NULL REFERENCES users(id),
    student_id UUID NOT NULL REFERENCES users(id),
    otp VARCHAR(6),
    otp_expiry TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending_confirmation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sessions_status_check CHECK (status IN ('pending_confirmation', 'confirmed', 'expired'))
);

-- Add indexes for better query performance
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_helper_id ON sessions(helper_id);
CREATE INDEX idx_sessions_student_id ON sessions(student_id);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows authenticated users to do everything
-- We'll add more restrictive policies later
CREATE POLICY sessions_authenticated_access ON sessions
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true); 
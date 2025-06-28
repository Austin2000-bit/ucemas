-- Create complaints table if it doesn't exist
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create helper_student_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS helper_student_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    helper_id UUID NOT NULL REFERENCES users(id),
    student_id UUID NOT NULL REFERENCES users(id),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
    academic_year VARCHAR(9) NOT NULL CHECK (academic_year ~ '^\\d{4}-\\d{4}$'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a partial unique index for active assignments
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_assignment_per_student_year
ON helper_student_assignments (student_id, academic_year)
WHERE (status = 'active');

-- Create student_help_confirmations table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_help_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id),
    helper_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_helper_student_assignments_status ON helper_student_assignments(status);
CREATE INDEX IF NOT EXISTS idx_helper_student_assignments_helper_id ON helper_student_assignments(helper_id);
CREATE INDEX IF NOT EXISTS idx_helper_student_assignments_student_id ON helper_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_help_confirmations_status ON student_help_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_student_help_confirmations_helper_id ON student_help_confirmations(helper_id);
CREATE INDEX IF NOT EXISTS idx_student_help_confirmations_student_id ON student_help_confirmations(student_id);

-- Add RLS policies
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_help_confirmations ENABLE ROW LEVEL SECURITY;

-- Complaints policies
CREATE POLICY "Users can create complaints"
ON complaints FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own complaints"
ON complaints FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all complaints"
ON complaints FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Helper-Student Assignment policies
CREATE POLICY "Admins can manage assignments"
ON helper_student_assignments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

CREATE POLICY "Helpers can view their assignments"
ON helper_student_assignments FOR SELECT
TO authenticated
USING (helper_id = auth.uid());

CREATE POLICY "Students can view their assignments"
ON helper_student_assignments FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Help Confirmation policies
CREATE POLICY "Students can create and manage their confirmations"
ON student_help_confirmations FOR ALL
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Helpers can view and update their confirmations"
ON student_help_confirmations FOR ALL
TO authenticated
USING (helper_id = auth.uid());

CREATE POLICY "Admins can view all confirmations"
ON student_help_confirmations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
); 
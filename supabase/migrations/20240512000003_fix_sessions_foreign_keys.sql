-- Add foreign key constraints to sessions table
ALTER TABLE sessions 
ADD CONSTRAINT fk_sessions_helper_id 
FOREIGN KEY (helper_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE sessions 
ADD CONSTRAINT fk_sessions_student_id 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_helper_id_fk ON sessions(helper_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id_fk ON sessions(student_id); 
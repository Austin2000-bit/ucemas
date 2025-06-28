-- Insert test users if they don't exist
INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
SELECT 
    uuid_generate_v4(), 
    'admin@test.com',
    'Admin',
    'User',
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@test.com'
);

INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    'helper1@test.com',
    'Helper',
    'One',
    'helper',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'helper1@test.com'
);

INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    'student1@test.com',
    'Student',
    'One',
    'student',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'student1@test.com'
);

-- Insert test complaints
INSERT INTO complaints (user_id, title, description, status, created_at, updated_at)
SELECT 
    (SELECT id FROM users WHERE email = 'student1@test.com'),
    'Need Help with Reading',
    'I need assistance with reading my course materials',
    'pending',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days';

INSERT INTO complaints (user_id, title, description, status, created_at, updated_at)
SELECT 
    (SELECT id FROM users WHERE email = 'student1@test.com'),
    'Assignment Support Required',
    'Need help with taking notes during lectures',
    'in_progress',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days';

INSERT INTO complaints (user_id, title, description, status, created_at, updated_at)
SELECT 
    (SELECT id FROM users WHERE email = 'student1@test.com'),
    'Mobility Assistance',
    'Need help with getting around campus',
    'resolved',
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP - INTERVAL '8 days';

-- Insert test helper-student assignments
INSERT INTO helper_student_assignments (helper_id, student_id, status, academic_year, created_at, updated_at)
SELECT 
    (SELECT id FROM users WHERE email = 'helper1@test.com'),
    (SELECT id FROM users WHERE email = 'student1@test.com'),
    'active',
    '2023-2024',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM helper_student_assignments
    WHERE student_id = (SELECT id FROM users WHERE email = 'student1@test.com')
    AND academic_year = '2023-2024'
);

-- Insert test help confirmations
INSERT INTO student_help_confirmations (student_id, helper_id, date, status, created_at, updated_at)
SELECT 
    (SELECT id FROM users WHERE email = 'student1@test.com'),
    (SELECT id FROM users WHERE email = 'helper1@test.com'),
    CURRENT_DATE - INTERVAL '1 day',
    'confirmed',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE NOT EXISTS (
    SELECT 1 FROM student_help_confirmations
    WHERE student_id = (SELECT id FROM users WHERE email = 'student1@test.com')
    AND date = CURRENT_DATE - INTERVAL '1 day'
);

INSERT INTO student_help_confirmations (student_id, helper_id, date, status, created_at, updated_at)
SELECT 
    (SELECT id FROM users WHERE email = 'student1@test.com'),
    (SELECT id FROM users WHERE email = 'helper1@test.com'),
    CURRENT_DATE,
    'pending',
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
WHERE NOT EXISTS (
    SELECT 1 FROM student_help_confirmations
    WHERE student_id = (SELECT id FROM users WHERE email = 'student1@test.com')
    AND date = CURRENT_DATE
); 
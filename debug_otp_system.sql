-- Debug OTP System - Run this in Supabase SQL Editor

-- 1. Check if required columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sessions' 
ORDER BY ordinal_position;

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_help_confirmations' 
ORDER BY ordinal_position;

-- 2. Check recent sessions
SELECT 
    id,
    helper_id,
    student_id,
    otp,
    description,
    status,
    created_at,
    otp_expiry
FROM sessions 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check recent confirmations
SELECT 
    id,
    student_id,
    helper_id,
    session_id,
    date,
    status,
    description,
    created_at
FROM student_help_confirmations 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check for any pending confirmations for today
SELECT 
    shc.id,
    shc.student_id,
    shc.helper_id,
    shc.date,
    shc.status,
    s.otp,
    s.status as session_status
FROM student_help_confirmations shc
LEFT JOIN sessions s ON shc.session_id = s.id
WHERE shc.date = CURRENT_DATE
ORDER BY shc.created_at DESC; 
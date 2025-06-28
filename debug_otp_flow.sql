-- OTP Flow Debug Script
-- Run this in your Supabase SQL Editor

-- 1. Check if required columns exist
SELECT '=== CHECKING DATABASE STRUCTURE ===' as info;

SELECT 'Sessions table columns:' as table_info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' 
ORDER BY ordinal_position;

SELECT 'Student_help_confirmations table columns:' as table_info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'student_help_confirmations' 
ORDER BY ordinal_position;

-- 2. Check for any existing sessions
SELECT '=== CHECKING EXISTING SESSIONS ===' as info;
SELECT 
    id,
    helper_id,
    student_id,
    otp,
    status,
    created_at,
    otp_expiry
FROM sessions 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check for any existing confirmations
SELECT '=== CHECKING EXISTING CONFIRMATIONS ===' as info;
SELECT 
    id,
    student_id,
    helper_id,
    session_id,
    date,
    status,
    created_at
FROM student_help_confirmations 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check helper-student assignments
SELECT '=== CHECKING HELPER-STUDENT ASSIGNMENTS ===' as info;
SELECT 
    hsa.helper_id,
    hsa.student_id,
    hsa.status,
    helper.first_name as helper_first_name,
    helper.last_name as helper_last_name,
    student.first_name as student_first_name,
    student.last_name as student_last_name
FROM helper_student_assignments hsa
LEFT JOIN users helper ON hsa.helper_id = helper.id
LEFT JOIN users student ON hsa.student_id = student.id
WHERE hsa.status = 'active'
ORDER BY hsa.created_at DESC; 
-- Debug script to check user trigger functionality
-- Run this in the Supabase SQL Editor

-- 1. Check if the trigger function exists and its definition
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 2. Check if the trigger exists and is properly configured
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    event_object_schema,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_schema = 'auth';

-- 3. Check the structure of the users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there are any recent users in auth.users that don't have corresponding records in public.users
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    CASE WHEN pu.id IS NULL THEN 'MISSING' ELSE 'EXISTS' END as profile_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.created_at > NOW() - INTERVAL '24 hours'
ORDER BY au.created_at DESC;

-- 5. Check for any recent errors in the PostgreSQL logs (if accessible)
-- This might show trigger execution errors
SELECT 
    log_time,
    message
FROM pg_stat_activity 
WHERE state = 'active' 
AND query LIKE '%handle_new_user%'
ORDER BY log_time DESC
LIMIT 10;

-- 6. Test the trigger function manually with sample data
-- (This will help identify if the function works but the trigger doesn't)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_metadata JSONB := '{
        "first_name": "Test",
        "last_name": "User",
        "role": "student",
        "phone": "1234567890",
        "password_plaintext": "testpassword123"
    }'::JSONB;
BEGIN
    -- Simulate what the trigger would do
    INSERT INTO public.users (
        id, 
        email, 
        first_name, 
        last_name, 
        role, 
        phone, 
        password_plaintext,
        status,
        created_at,
        updated_at
    )
    VALUES (
        test_user_id,
        'test@example.com',
        test_metadata->>'first_name',
        test_metadata->>'last_name',
        (test_metadata->>'role')::user_role,
        test_metadata->>'phone',
        test_metadata->>'password_plaintext',
        'active',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Test user created with ID: %', test_user_id;
    
    -- Clean up the test user
    DELETE FROM public.users WHERE id = test_user_id;
    RAISE NOTICE 'Test user cleaned up';
END $$;

-- 7. Check RLS policies on the users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'; 
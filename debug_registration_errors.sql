-- Debug script to identify registration errors
-- Run this in the Supabase SQL Editor

-- 1. Check the current users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if the password_plaintext column exists
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name = 'password_plaintext';

-- 3. Check RLS policies on users table
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

-- 4. Check if the trigger function exists and is correct
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 5. Check if the trigger exists
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

-- 6. Test a simple insert to see if there are any constraint violations
-- (This will help identify if the issue is with the data or the table structure)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Try to insert a minimal user record
    INSERT INTO public.users (
        id, 
        email, 
        first_name, 
        last_name, 
        role, 
        phone,
        status,
        created_at,
        updated_at
    )
    VALUES (
        test_user_id,
        'test@example.com',
        'Test',
        'User',
        'student',
        '1234567890',
        'active',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Test insert successful for user ID: %', test_user_id;
    
    -- Clean up
    DELETE FROM public.users WHERE id = test_user_id;
    RAISE NOTICE 'Test user cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test insert failed with error: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 7. Check for any active queries related to users table
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query
FROM pg_stat_activity 
WHERE state = 'active' 
AND query LIKE '%users%'
ORDER BY query_start DESC
LIMIT 10;

-- 8. Check if there are any recent users in auth.users that don't have corresponding records in public.users
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    CASE WHEN pu.id IS NULL THEN 'MISSING' ELSE 'EXISTS' END as profile_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.created_at > NOW() - INTERVAL '24 hours'
ORDER BY au.created_at DESC;

-- 9. Check the user_role enum values
SELECT unnest(enum_range(NULL::user_role)) as valid_roles;

-- 10. Check for any foreign key constraints that might be causing issues
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='users'; 
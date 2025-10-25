-- Debug script to check user registration issues
-- Run this in Supabase SQL Editor to diagnose the problem

-- 1. Check if the user_role enum has the correct values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- 2. Check if users table exists and has correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if the trigger function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 4. Check if the trigger exists
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Check recent users in auth.users table
SELECT id, email, email_confirmed_at, confirmed_at, created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Check recent users in public.users table
SELECT id, email, first_name, last_name, role, created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Check for users that exist in auth but not in public.users
SELECT au.id, au.email, au.email_confirmed_at, au.confirmed_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

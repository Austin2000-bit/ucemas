-- Check if the trigger function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_schema = 'auth';

-- Check the structure of the users table to see if it matches the trigger
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any recent errors in the PostgreSQL logs (if accessible)
-- This might show trigger execution errors
SELECT 
    log_time,
    message
FROM pg_stat_activity 
WHERE state = 'active' 
AND query LIKE '%handle_new_user%'
ORDER BY log_time DESC
LIMIT 10; 
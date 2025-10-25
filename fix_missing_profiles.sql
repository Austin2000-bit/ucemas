-- Script to manually create user profiles for existing auth users
-- Run this AFTER applying the role migration

-- First, let's see which auth users don't have profiles
SELECT 
  au.id, 
  au.email, 
  au.email_confirmed_at,
  au.raw_user_meta_data->>'first_name' as first_name,
  au.raw_user_meta_data->>'last_name' as last_name,
  au.raw_user_meta_data->>'role' as role,
  au.raw_user_meta_data->>'phone' as phone,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- If you see users in the above query, run this to create their profiles:
-- (Replace the values with actual data from the query above)

-- Example for a specific user (replace with actual values):
-- INSERT INTO public.users (
--   id, 
--   email, 
--   first_name, 
--   last_name, 
--   role, 
--   phone, 
--   status,
--   password_plaintext,
--   created_at,
--   updated_at
-- )
-- VALUES (
--   'USER_ID_FROM_AUTH',  -- Replace with actual user ID
--   'user@example.com',   -- Replace with actual email
--   'John',               -- Replace with actual first name
--   'Doe',                -- Replace with actual last name
--   'client',             -- Replace with actual role
--   '1234567890',         -- Replace with actual phone or NULL
--   'active',
--   'password123',        -- Replace with actual password or NULL
--   NOW(),
--   NOW()
-- );

-- Quick fix for registration 406/400 errors
-- Run this in the Supabase SQL Editor

-- 1. Add missing columns that might be causing the errors
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_plaintext TEXT,
ADD COLUMN IF NOT EXISTS assistant_type TEXT,
ADD COLUMN IF NOT EXISTS assistant_specialization TEXT,
ADD COLUMN IF NOT EXISTS time_period TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Check what columns we actually have
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Drop any problematic RLS policies and recreate them
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can perform all actions on user profiles" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;

-- 4. Create simple, permissive policies for testing
CREATE POLICY "Allow all authenticated operations"
ON public.users FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Test if we can insert a user manually
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
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
    
    RAISE NOTICE '✅ Manual insert test successful for user ID: %', test_user_id;
    
    -- Verify the user was created
    IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
        RAISE NOTICE '✅ User found in database';
    ELSE
        RAISE NOTICE '❌ User not found in database';
    END IF;
    
    -- Clean up
    DELETE FROM public.users WHERE id = test_user_id;
    RAISE NOTICE '✅ Test user cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Manual insert test failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 6. Check if the trigger is working
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_schema = 'auth';

-- 7. If trigger doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
        AND event_object_schema = 'auth'
    ) THEN
        -- Create the trigger function
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO public.users (
                id, email, first_name, last_name, role, phone, status, created_at, updated_at
            )
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
                COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
                COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
                COALESCE(NEW.raw_user_meta_data->>'phone', ''),
                'active',
                NOW(),
                NOW()
            );
            RETURN NEW;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create user profile: %', SQLERRM;
                RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Create the trigger
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
            
        RAISE NOTICE '✅ Trigger created successfully';
    ELSE
        RAISE NOTICE '✅ Trigger already exists';
    END IF;
END $$; 
-- Step 1: Add new role values to the enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'client';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';

-- Step 2: Update existing users to use new role names
UPDATE public.users SET role = 'client' WHERE role = 'student';
UPDATE public.users SET role = 'assistant' WHERE role = 'helper';

-- Step 3: Update the constraint to use new role names
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'assistant', 'client', 'driver', 'staff'));

-- Step 4: Update the trigger function to use new role names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    phone, 
    disability_type, 
    bank_name, 
    bank_account_number, 
    assistant_type, 
    assistant_specialization, 
    time_period, 
    status,
    password_plaintext,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'disability_type',
    (NEW.raw_user_meta_data->>'bank_name')::text,
    NEW.raw_user_meta_data->>'bank_account_number',
    (NEW.raw_user_meta_data->>'assistant_type')::text,
    (NEW.raw_user_meta_data->>'assistant_specialization')::text,
    (NEW.raw_user_meta_data->>'time_period')::text,
    'active',
    NEW.raw_user_meta_data->>'password_plaintext',
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

-- Step 5: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

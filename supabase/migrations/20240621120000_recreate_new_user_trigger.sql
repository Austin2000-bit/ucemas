-- Function to create a new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role, phone, disability_type, bank_name, bank_account_number, category, specialization, profile_picture_url, application_letter_url, disability_video_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    (NEW.raw_user_meta_data->>'role')::user_role,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'disability_type',
    NEW.raw_user_meta_data->>'bank_name',
    NEW.raw_user_meta_data->>'bank_account_number',
    (NEW.raw_user_meta_data->>'category')::text, -- Cast to text, adjust if you have an enum
    (NEW.raw_user_meta_data->>'specialization')::text, -- Cast to text, adjust if you have an enum
    NEW.raw_user_meta_data->>'profile_picture_url',
    NEW.raw_user_meta_data->>'application_letter_url',
    NEW.raw_user_meta_data->>'disability_video_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
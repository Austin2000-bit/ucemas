-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-pictures', 'profile-pictures', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('application-letters', 'application-letters', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('disability-videos', 'disability-videos', true) ON CONFLICT DO NOTHING;

-- Update users table to use URLs instead of storing files directly
ALTER TABLE users
  DROP COLUMN IF EXISTS profile_picture,
  DROP COLUMN IF EXISTS application_letter,
  DROP COLUMN IF EXISTS disability_video,
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
  ADD COLUMN IF NOT EXISTS application_letter_url TEXT,
  ADD COLUMN IF NOT EXISTS disability_video_url TEXT;

-- Add storage policies for each bucket
-- Profile Pictures
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Application Letters
CREATE POLICY "Assistants can upload their application letter"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'application-letters' AND
  (auth.uid())::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'assistant'
  )
);

CREATE POLICY "Application letters are accessible to admins and owners"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-letters' AND
  (
    (auth.uid())::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
);

CREATE POLICY "Users can delete their own application letter"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'application-letters' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Disability Videos
CREATE POLICY "Students can upload their disability video"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'disability-videos' AND
  (auth.uid())::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'student'
  )
);

CREATE POLICY "Disability videos are accessible to admins, helpers, and owners"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'disability-videos' AND
  (
    (auth.uid())::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.role = 'helper')
    )
  )
);

CREATE POLICY "Users can delete their own disability video"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'disability-videos' AND
  (auth.uid())::text = (storage.foldername(name))[1]
); 
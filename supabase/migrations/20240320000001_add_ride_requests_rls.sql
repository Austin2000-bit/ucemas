-- Enable Row Level Security
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

-- Policy for non-driver users to create ride requests
CREATE POLICY "Non-driver users can create ride requests"
ON ride_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role != 'driver'
  )
);

-- Policy for users to view their own ride requests
CREATE POLICY "Users can view their own ride requests"
ON ride_requests
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
);

-- Policy for drivers to view pending ride requests
CREATE POLICY "Drivers can view pending ride requests"
ON ride_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'driver'
  )
  AND status = 'pending'
);

-- Policy for drivers to update ride requests they've accepted
CREATE POLICY "Drivers can update their accepted rides"
ON ride_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'driver'
  )
  AND driver_id = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'driver'
  )
  AND driver_id = auth.uid()
);

-- Policy for admins to view all ride requests
CREATE POLICY "Admins can view all ride requests"
ON ride_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy for users to update their own ride requests
CREATE POLICY "Users can update their own ride requests"
ON ride_requests
FOR UPDATE
TO authenticated
USING (
  student_id = auth.uid()
)
WITH CHECK (
  student_id = auth.uid()
);

-- Policy for users to delete their own pending ride requests
CREATE POLICY "Users can delete their own pending ride requests"
ON ride_requests
FOR DELETE
TO authenticated
USING (
  student_id = auth.uid()
  AND status = 'pending'
); 
-- Add location tracking columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS current_location JSONB,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'Bajaj',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline'));

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_current_location ON users USING GIN (current_location);

-- Create function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
) RETURNS double precision AS $$
DECLARE
  R double precision := 6371; -- Earth's radius in kilometers
  dlat double precision;
  dlon double precision;
  a double precision;
  c double precision;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to find nearby drivers
CREATE OR REPLACE FUNCTION find_nearby_drivers(
  user_lat double precision,
  user_lon double precision,
  radius_km double precision DEFAULT 5
) RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  current_location jsonb,
  vehicle_type text,
  status text,
  distance double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.current_location,
    u.vehicle_type,
    u.status,
    calculate_distance(
      user_lat,
      user_lon,
      (u.current_location->>'lat')::double precision,
      (u.current_location->>'lng')::double precision
    ) as distance
  FROM users u
  WHERE 
    u.role = 'driver'
    AND u.status = 'available'
    AND u.current_location IS NOT NULL
    AND calculate_distance(
      user_lat,
      user_lon,
      (u.current_location->>'lat')::double precision,
      (u.current_location->>'lng')::double precision
    ) <= radius_km
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql STABLE; 
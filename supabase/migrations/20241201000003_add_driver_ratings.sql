-- Create driver_ratings table for rating drivers after ride completion
CREATE TABLE IF NOT EXISTS public.driver_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ride_id UUID REFERENCES ride_requests(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rider_id, ride_id)
);

-- Enable RLS
ALTER TABLE public.driver_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driver_ratings
-- Allow riders (clients and assistants) to insert their own ratings
CREATE POLICY "Riders can insert their own ratings"
ON public.driver_ratings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = rider_id);

-- Allow riders to view their own ratings
CREATE POLICY "Riders can view their own ratings"
ON public.driver_ratings
FOR SELECT
TO authenticated
USING (auth.uid() = rider_id);

-- Allow drivers to view ratings for themselves
CREATE POLICY "Drivers can view their own ratings"
ON public.driver_ratings
FOR SELECT
TO authenticated
USING (auth.uid() = driver_id);

-- Allow admins to view all ratings
CREATE POLICY "Admins can view all ratings"
ON public.driver_ratings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow admins to manage all ratings
CREATE POLICY "Admins can manage all ratings"
ON public.driver_ratings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Function to calculate average rating for a driver
CREATE OR REPLACE FUNCTION get_average_rating_for_driver(driver_uuid UUID)
RETURNS TABLE(
    average_rating NUMERIC,
    total_ratings BIGINT,
    ratings_by_star JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(AVG(rating::numeric), 0) as average_rating,
        COUNT(*)::BIGINT as total_ratings,
        jsonb_object_agg(rating, rating_count) as ratings_by_star
    FROM (
        SELECT 
            rating,
            COUNT(*) as rating_count
        FROM driver_ratings
        WHERE driver_id = driver_uuid
        GROUP BY rating
    ) subquery;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

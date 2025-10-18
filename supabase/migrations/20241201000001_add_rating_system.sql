-- Migration: Add rating system for assistants
-- This migration creates tables for students to rate their assistants and admin to view ratings

-- 1. Create assistant_ratings table
CREATE TABLE IF NOT EXISTS assistant_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assistant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one rating per student per session
    UNIQUE(student_id, session_id)
);

-- 2. Create rating_categories table for admin grading
CREATE TABLE IF NOT EXISTS rating_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    min_rating DECIMAL(3,2) NOT NULL,
    max_rating DECIMAL(3,2) NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6B7280', -- Default gray color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure no overlapping ranges
    CONSTRAINT no_overlapping_ranges CHECK (min_rating <= max_rating)
);

-- 3. Insert default rating categories
INSERT INTO rating_categories (name, min_rating, max_rating, description, color) VALUES
('Excellent', 4.5, 5.0, 'Outstanding performance, exceeds expectations', '#10B981'),
('Good', 3.5, 4.4, 'Good performance, meets expectations', '#3B82F6'),
('Satisfactory', 2.5, 3.4, 'Adequate performance, meets basic requirements', '#F59E0B'),
('Unsatisfactory', 1.0, 2.4, 'Below expectations, needs improvement', '#EF4444')
ON CONFLICT (name) DO NOTHING;

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assistant_ratings_student_id ON assistant_ratings(student_id);
CREATE INDEX IF NOT EXISTS idx_assistant_ratings_assistant_id ON assistant_ratings(assistant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_ratings_rating ON assistant_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_assistant_ratings_created_at ON assistant_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_rating_categories_range ON rating_categories(min_rating, max_rating);

-- 5. Enable RLS
ALTER TABLE assistant_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_categories ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for assistant_ratings
-- Students can create and view their own ratings
CREATE POLICY "Students can create their own ratings"
ON assistant_ratings FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view their own ratings"
ON assistant_ratings FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Assistants can view ratings about them
CREATE POLICY "Assistants can view ratings about them"
ON assistant_ratings FOR SELECT
TO authenticated
USING (assistant_id = auth.uid());

-- Admins can view all ratings
CREATE POLICY "Admins can view all ratings"
ON assistant_ratings FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- 7. Create RLS policies for rating_categories
-- Everyone can view rating categories
CREATE POLICY "Everyone can view rating categories"
ON rating_categories FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage rating categories
CREATE POLICY "Admins can manage rating categories"
ON rating_categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- 8. Create a function to get average rating for an assistant
CREATE OR REPLACE FUNCTION get_assistant_average_rating(assistant_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
BEGIN
    RETURN (
        SELECT COALESCE(AVG(rating), 0.0)
        FROM assistant_ratings
        WHERE assistant_id = assistant_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- 9. Create a function to get rating category for a rating
CREATE OR REPLACE FUNCTION get_rating_category(rating_value DECIMAL(3,2))
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT name
        FROM rating_categories
        WHERE rating_value >= min_rating AND rating_value <= max_rating
        ORDER BY min_rating DESC
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- 10. Add comments for documentation
COMMENT ON TABLE assistant_ratings IS 'Stores ratings given by students to their assistants (1-5 scale)';
COMMENT ON TABLE rating_categories IS 'Defines grading categories for assistant ratings (Excellent, Good, Satisfactory, Unsatisfactory)';
COMMENT ON COLUMN assistant_ratings.rating IS 'Rating from 1 (poor) to 5 (excellent)';
COMMENT ON COLUMN assistant_ratings.session_id IS 'Links to the session that generated this rating';
COMMENT ON FUNCTION get_assistant_average_rating IS 'Returns the average rating for a specific assistant';
COMMENT ON FUNCTION get_rating_category IS 'Returns the category name for a given rating value';

-- Add foreign key constraint from student_help_confirmations to users table
-- This allows Supabase to join the tables in queries.

ALTER TABLE public.student_help_confirmations
ADD CONSTRAINT student_help_confirmations_student_id_fkey
FOREIGN KEY (student_id) REFERENCES public.users(id)
ON DELETE SET NULL;

-- Also add a constraint for the helper_id for consistency
ALTER TABLE public.student_help_confirmations
ADD CONSTRAINT student_help_confirmations_helper_id_fkey
FOREIGN KEY (helper_id) REFERENCES public.users(id)
ON DELETE SET NULL; 

-- Migration: Add context_label column to persons table
-- Purpose: Fix PGRST204 error when adding topics from Home screen
-- Date: 2024
-- 
-- This migration adds a nullable text column named "context_label" to the "persons" table.
-- The context_label field is used to store additional context for topics (e.g., "Work", "Family", "School").
-- This field is optional and can be null.

-- Add the context_label column if it doesn't exist
ALTER TABLE public.persons 
ADD COLUMN IF NOT EXISTS context_label TEXT;

-- Add a comment to document the column's purpose
COMMENT ON COLUMN public.persons.context_label IS 'Optional context label for topics (e.g., Work, Family, School). Used to provide additional context when discussing a topic.';

-- Verify the column was added successfully
-- You can run this query to check:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'persons' AND column_name = 'context_label';

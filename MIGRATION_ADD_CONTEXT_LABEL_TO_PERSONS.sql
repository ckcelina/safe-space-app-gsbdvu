
-- Migration: Add context_label column to persons table
-- Purpose: Fix PGRST204 error when creating topics with context labels
-- Date: 2024
-- 
-- This migration adds a nullable TEXT column named "context_label" to the persons table.
-- The column stores optional context information for topics (e.g., "Work", "Family", "School").
--
-- IMPORTANT: Run this migration in your Supabase SQL Editor
-- After running, the schema cache will be automatically refreshed.

-- Step 1: Add the context_label column if it doesn't exist
ALTER TABLE public.persons 
ADD COLUMN IF NOT EXISTS context_label TEXT NULL;

-- Step 2: Add a comment to document the column purpose
COMMENT ON COLUMN public.persons.context_label IS 'Optional context label for topics (e.g., Work, Family, School). Used to provide additional context when discussing a topic.';

-- Step 3: Create an index for faster queries on context_label (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_persons_context_label 
ON public.persons(context_label) 
WHERE context_label IS NOT NULL;

-- Step 4: Verify the column was added successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'persons' 
        AND column_name = 'context_label'
    ) THEN
        RAISE NOTICE 'SUCCESS: context_label column added to persons table';
    ELSE
        RAISE EXCEPTION 'FAILED: context_label column was not added';
    END IF;
END $$;

-- Step 5: Force PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';

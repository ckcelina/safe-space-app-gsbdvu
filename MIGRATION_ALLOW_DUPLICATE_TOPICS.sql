
-- Migration: Allow duplicate topic names with optional context labels
-- Goal: Users can add multiple topics with the same name but different contexts
-- Example: "Anxiety – Work", "Anxiety – Family"

-- Step 1: Drop the partial unique index for Topics
DROP INDEX IF EXISTS public.persons_user_topic_name_unique;

-- Step 2: Add a context_label column to persons table (optional)
ALTER TABLE public.persons 
ADD COLUMN IF NOT EXISTS context_label TEXT;

-- Step 3: Create a regular (non-unique) index for better query performance
CREATE INDEX IF NOT EXISTS idx_persons_name ON public.persons(name);
CREATE INDEX IF NOT EXISTS idx_persons_relationship_type ON public.persons(relationship_type);

-- Verification: Log the change
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Topics can now have duplicate names with optional context labels.';
END $$;

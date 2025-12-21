
-- MIGRATION: Fix duplicate names and topics issues
-- This migration addresses Parts A and C of the issue

-- PART A: Remove the unique constraint that blocks duplicate person names
-- This allows users to add multiple people with the same name (e.g., multiple "Mom", "Dad", etc.)
ALTER TABLE public.persons 
DROP CONSTRAINT IF EXISTS persons_user_id_name_unique;

-- Also drop any partial unique index for topics if it exists
DROP INDEX IF EXISTS persons_user_topic_name_unique;

-- PART B: Add created_at column if it doesn't exist (for stable ordering)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'persons' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.persons 
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    
    -- Backfill created_at for existing rows
    UPDATE public.persons 
    SET created_at = NOW() 
    WHERE created_at IS NULL;
  END IF;
END $$;

-- Create index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_persons_created_at 
ON public.persons(created_at DESC);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_persons_user_id 
ON public.persons(user_id);

-- Create composite index for filtering by user_id and relationship_type
CREATE INDEX IF NOT EXISTS idx_persons_user_relationship 
ON public.persons(user_id, relationship_type);

-- Verify the constraint has been removed
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'persons_user_id_name_unique'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE 'WARNING: persons_user_id_name_unique constraint still exists!';
  ELSE
    RAISE NOTICE 'SUCCESS: persons_user_id_name_unique constraint has been removed';
  END IF;
END $$;

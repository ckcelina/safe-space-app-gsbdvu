
-- MIGRATION: Separate People and Topics into distinct tables
-- This fixes the duplicate key constraint error and data model issues
-- Run this in your Supabase SQL Editor

-- STEP 1: Create topics table
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  context_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topics
CREATE POLICY "Users can view own topics"
  ON public.topics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topics"
  ON public.topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topics"
  ON public.topics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topics"
  ON public.topics FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for topics
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON public.topics(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_created_at ON public.topics(user_id, created_at DESC);

-- STEP 2: Migrate existing topic entries from persons to topics
INSERT INTO public.topics (id, user_id, name, context_label, created_at, updated_at)
SELECT 
  id,
  user_id,
  name,
  context_label,
  COALESCE(created_at, NOW()) as created_at,
  COALESCE(created_at, NOW()) as updated_at
FROM public.persons
WHERE relationship_type = 'Topic'
ON CONFLICT (id) DO NOTHING;

-- STEP 3: Delete migrated topics from persons table
DELETE FROM public.persons WHERE relationship_type = 'Topic';

-- STEP 4: Update persons table structure
-- Add context_label if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'persons' 
    AND column_name = 'context_label'
  ) THEN
    ALTER TABLE public.persons ADD COLUMN context_label TEXT;
  END IF;
END $$;

-- Add updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'persons' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.persons ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    UPDATE public.persons SET updated_at = created_at WHERE updated_at IS NULL;
  END IF;
END $$;

-- STEP 5: Remove unique constraint on persons (user_id, name)
DO $$ 
BEGIN
    -- Try to drop constraint with common naming patterns
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'persons_user_id_name_unique'
    ) THEN
        ALTER TABLE public.persons DROP CONSTRAINT persons_user_id_name_unique;
        RAISE NOTICE 'Dropped constraint: persons_user_id_name_unique';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'persons_user_id_name_key'
    ) THEN
        ALTER TABLE public.persons DROP CONSTRAINT persons_user_id_name_key;
        RAISE NOTICE 'Dropped constraint: persons_user_id_name_key';
    END IF;
    
    -- Drop any unique index on (user_id, name)
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'persons_user_id_name_idx' 
        AND indexdef LIKE '%UNIQUE%'
    ) THEN
        DROP INDEX IF EXISTS persons_user_id_name_idx;
        RAISE NOTICE 'Dropped unique index: persons_user_id_name_idx';
    END IF;
END $$;

-- STEP 6: Make relationship_type nullable in persons
ALTER TABLE public.persons ALTER COLUMN relationship_type DROP NOT NULL;

-- STEP 7: Create indexes for persons
CREATE INDEX IF NOT EXISTS idx_persons_user_created ON public.persons(user_id, created_at DESC);

-- STEP 8: Update messages table to support both person_id and topic_id
-- Add topic_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'topic_id'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Make person_id nullable (messages can be for either a person OR a topic)
ALTER TABLE public.messages ALTER COLUMN person_id DROP NOT NULL;

-- Add check constraint to ensure either person_id or topic_id is set (but not both)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_person_or_topic_check'
  ) THEN
    ALTER TABLE public.messages 
    ADD CONSTRAINT messages_person_or_topic_check 
    CHECK (
      (person_id IS NOT NULL AND topic_id IS NULL) OR 
      (person_id IS NULL AND topic_id IS NOT NULL)
    );
  END IF;
END $$;

-- Create index for topic_id
CREATE INDEX IF NOT EXISTS idx_messages_topic_id ON public.messages(topic_id);

-- STEP 9: Verification
DO $$
DECLARE
  persons_constraint_exists BOOLEAN;
  topics_table_exists BOOLEAN;
BEGIN
  -- Check if persons constraint was removed
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'persons_user_id_name_unique'
  ) INTO persons_constraint_exists;
  
  IF persons_constraint_exists THEN
    RAISE WARNING 'persons_user_id_name_unique constraint still exists!';
  ELSE
    RAISE NOTICE '✅ persons_user_id_name_unique constraint removed';
  END IF;
  
  -- Check if topics table was created
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'topics'
  ) INTO topics_table_exists;
  
  IF topics_table_exists THEN
    RAISE NOTICE '✅ topics table created successfully';
  ELSE
    RAISE WARNING 'topics table was not created!';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE public.persons IS 'Stores people that users talk about. Multiple people with the same name are allowed (differentiated by UUID).';
COMMENT ON TABLE public.topics IS 'Stores topics that users want to discuss. Separate from persons table.';
COMMENT ON COLUMN public.messages.person_id IS 'References a person (mutually exclusive with topic_id)';
COMMENT ON COLUMN public.messages.topic_id IS 'References a topic (mutually exclusive with person_id)';

-- Log success
RAISE NOTICE '✅ Migration completed successfully';
RAISE NOTICE '✅ People and Topics are now in separate tables';
RAISE NOTICE '✅ Duplicate names are allowed for both People and Topics';

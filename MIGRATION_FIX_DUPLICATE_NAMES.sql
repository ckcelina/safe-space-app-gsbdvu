
-- =====================================================
-- Migration: Fix Duplicate Names Constraint
-- =====================================================
-- This migration allows users to add multiple people with the same name
-- (e.g., 2 moms, 2 dads, same-name friends)
--
-- CHANGES:
-- 1. Remove unique constraint on (user_id, name)
-- 2. Add person_key column (UUID, NOT NULL, DEFAULT gen_random_uuid())
-- 3. Add unique constraint on (user_id, person_key)
-- 4. Keep id as primary key
--
-- Run this in your Supabase SQL Editor
-- =====================================================

BEGIN;

-- Step 1: Drop the unique constraint on (user_id, name)
-- This constraint was preventing duplicate names
DO $$ 
BEGIN
    -- Try common constraint naming patterns
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'persons_user_id_name_unique'
        AND conrelid = 'public.persons'::regclass
    ) THEN
        ALTER TABLE public.persons DROP CONSTRAINT persons_user_id_name_unique;
        RAISE NOTICE '✓ Dropped constraint: persons_user_id_name_unique';
    ELSE
        RAISE NOTICE '⚠ Constraint persons_user_id_name_unique not found (may already be dropped)';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'persons_user_id_name_key'
        AND conrelid = 'public.persons'::regclass
    ) THEN
        ALTER TABLE public.persons DROP CONSTRAINT persons_user_id_name_key;
        RAISE NOTICE '✓ Dropped constraint: persons_user_id_name_key';
    ELSE
        RAISE NOTICE '⚠ Constraint persons_user_id_name_key not found (may already be dropped)';
    END IF;
    
    -- Drop any unique index on (user_id, name)
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public'
        AND tablename = 'persons'
        AND indexname = 'persons_user_id_name_idx' 
        AND indexdef LIKE '%UNIQUE%'
    ) THEN
        DROP INDEX IF EXISTS public.persons_user_id_name_idx;
        RAISE NOTICE '✓ Dropped unique index: persons_user_id_name_idx';
    ELSE
        RAISE NOTICE '⚠ Unique index persons_user_id_name_idx not found (may already be dropped)';
    END IF;
END $$;

-- Step 2: Add person_key column (UUID, NOT NULL, DEFAULT gen_random_uuid())
-- This provides a unique identifier for each person entry
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'persons' 
        AND column_name = 'person_key'
    ) THEN
        ALTER TABLE public.persons 
        ADD COLUMN person_key UUID NOT NULL DEFAULT gen_random_uuid();
        RAISE NOTICE '✓ Added column: person_key (UUID, NOT NULL, DEFAULT gen_random_uuid())';
    ELSE
        RAISE NOTICE '⚠ Column person_key already exists';
    END IF;
END $$;

-- Step 3: Add unique constraint on (user_id, person_key)
-- This ensures each person entry is uniquely identifiable
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'persons_user_id_person_key_unique'
        AND conrelid = 'public.persons'::regclass
    ) THEN
        ALTER TABLE public.persons 
        ADD CONSTRAINT persons_user_id_person_key_unique UNIQUE (user_id, person_key);
        RAISE NOTICE '✓ Added constraint: persons_user_id_person_key_unique';
    ELSE
        RAISE NOTICE '⚠ Constraint persons_user_id_person_key_unique already exists';
    END IF;
END $$;

-- Step 4: Verify primary key is still in place
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'persons_pkey' 
        AND contype = 'p'
        AND conrelid = 'public.persons'::regclass
    ) THEN
        RAISE EXCEPTION '❌ Primary key constraint missing on persons table!';
    END IF;
    
    RAISE NOTICE '✓ Primary key verified: Each person has a unique UUID (id column)';
END $$;

-- Step 5: Verify RLS is still enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename = 'persons' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ RLS is not enabled on persons table!';
    END IF;
    
    RAISE NOTICE '✓ RLS verified: Row Level Security is enabled';
END $$;

-- Step 6: Add documentation
COMMENT ON COLUMN public.persons.person_key IS 'Unique identifier for each person entry, allows duplicate names';
COMMENT ON TABLE public.persons IS 'Stores people that users talk about. Multiple people with the same name are allowed (differentiated by UUID).';

-- Step 7: Create index on person_key for performance
CREATE INDEX IF NOT EXISTS idx_persons_person_key ON public.persons(person_key);
RAISE NOTICE '✓ Created index: idx_persons_person_key';

COMMIT;

-- =====================================================
-- Migration Complete
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary of changes:';
    RAISE NOTICE '- Removed unique constraint on (user_id, name)';
    RAISE NOTICE '- Added person_key column (UUID)';
    RAISE NOTICE '- Added unique constraint on (user_id, person_key)';
    RAISE NOTICE '- Primary key (id) remains unchanged';
    RAISE NOTICE '- RLS policies remain active';
    RAISE NOTICE '';
    RAISE NOTICE 'Users can now add multiple people with the same name!';
    RAISE NOTICE '========================================';
END $$;


-- Migration: Remove unique constraint on persons table to allow duplicate names
-- This allows users to add multiple people with the same name (e.g., 2 Moms, 2 Dads)
-- Date: 2024

DO $$
BEGIN
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'persons_user_id_name_unique'
      AND table_name = 'persons'
  ) THEN
    EXECUTE 'ALTER TABLE public.persons DROP CONSTRAINT persons_user_id_name_unique';
    RAISE NOTICE 'Dropped constraint: persons_user_id_name_unique';
  ELSE
    RAISE NOTICE 'Constraint persons_user_id_name_unique does not exist';
  END IF;

  -- Drop unique index if it exists (common naming patterns)
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'persons_user_id_name_unique') THEN
    EXECUTE 'DROP INDEX public.persons_user_id_name_unique';
    RAISE NOTICE 'Dropped index: persons_user_id_name_unique';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'persons_user_id_name_key') THEN
    EXECUTE 'DROP INDEX public.persons_user_id_name_key';
    RAISE NOTICE 'Dropped index: persons_user_id_name_key';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'persons_user_id_name_idx') THEN
    EXECUTE 'DROP INDEX public.persons_user_id_name_idx';
    RAISE NOTICE 'Dropped index: persons_user_id_name_idx';
  END IF;

  RAISE NOTICE 'Migration completed successfully';
END $$;

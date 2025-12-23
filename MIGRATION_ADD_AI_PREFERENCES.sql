
-- Add AI Style Preferences columns to users table
-- Migration: Add ai_tone_id and ai_science_mode
-- Run this in your Supabase SQL Editor

-- Add ai_tone_id column with default 'balanced_blend'
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS ai_tone_id TEXT DEFAULT 'balanced_blend';

-- Add ai_science_mode column with default false
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS ai_science_mode BOOLEAN DEFAULT false;

-- Add check constraint for valid tone IDs (non-breaking)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_ai_tone_id_check'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_ai_tone_id_check 
    CHECK (ai_tone_id IN (
      'warm_hug', 'therapy_room', 'best_friend', 'nurturing_parent', 'soft_truth',
      'clear_coach', 'tough_love', 'straight_shooter', 'executive_summary', 'no_nonsense',
      'reality_check', 'pattern_breaker', 'accountability_partner', 'boundary_enforcer',
      'balanced_blend', 'mirror_mode', 'calm_direct',
      'detective', 'systems_thinker', 'attachment_aware', 'cognitive_clarity', 'conflict_mediator'
    )) NOT VALID;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_ai_tone_id ON public.users(ai_tone_id);

-- Update existing NULL values to default
UPDATE public.users 
SET ai_tone_id = 'balanced_blend' 
WHERE ai_tone_id IS NULL;

UPDATE public.users 
SET ai_science_mode = false 
WHERE ai_science_mode IS NULL;

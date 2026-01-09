
-- Create user_memory_notes table for therapist-specific conversation memory
CREATE TABLE IF NOT EXISTS public.user_memory_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  therapist_id TEXT NOT NULL,
  key_points TEXT[] DEFAULT '{}',
  patterns TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, therapist_id)
);

-- Enable RLS
ALTER TABLE public.user_memory_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own memory notes
CREATE POLICY "Users can view own memory notes"
  ON public.user_memory_notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory notes"
  ON public.user_memory_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory notes"
  ON public.user_memory_notes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_memory_notes_user_therapist 
  ON public.user_memory_notes(user_id, therapist_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_memory_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_memory_notes_updated_at
  BEFORE UPDATE ON public.user_memory_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memory_notes_updated_at();

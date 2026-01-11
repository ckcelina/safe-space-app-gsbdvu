
-- Create therapist_memory_notes table for pattern tracking
CREATE TABLE IF NOT EXISTS public.therapist_memory_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  therapist_id TEXT NOT NULL,
  recent_incidents TEXT[] DEFAULT '{}',
  recurring_patterns TEXT[] DEFAULT '{}',
  triggers TEXT[] DEFAULT '{}',
  helpful_strategies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, therapist_id)
);

-- Enable RLS
ALTER TABLE public.therapist_memory_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own memory notes
CREATE POLICY "Users can view own therapist memory notes"
  ON public.therapist_memory_notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own therapist memory notes"
  ON public.therapist_memory_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own therapist memory notes"
  ON public.therapist_memory_notes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for chat-images bucket
CREATE POLICY "Users can upload own chat images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own chat images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'chat-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );


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

-- Add type and image_url columns to messages table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='type') THEN
    ALTER TABLE public.messages ADD COLUMN type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='image_url') THEN
    ALTER TABLE public.messages ADD COLUMN image_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='caption') THEN
    ALTER TABLE public.messages ADD COLUMN caption TEXT;
  END IF;
END $$;

-- Create storage bucket for chat images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for chat-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload own chat images'
  ) THEN
    CREATE POLICY "Users can upload own chat images"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'chat-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can view own chat images'
  ) THEN
    CREATE POLICY "Users can view own chat images"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'chat-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete own chat images'
  ) THEN
    CREATE POLICY "Users can delete own chat images"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'chat-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

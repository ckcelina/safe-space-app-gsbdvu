
-- Migration: Add subject column to messages table
-- This enables topic-based conversation filtering

-- Add subject column if it doesn't exist
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS subject TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_subject 
ON public.messages(subject);

-- Backfill existing messages with 'General' subject
UPDATE public.messages 
SET subject = 'General' 
WHERE subject IS NULL OR subject = '';

-- Add comment for documentation
COMMENT ON COLUMN public.messages.subject IS 'Topic or subject of the conversation (e.g., General, Work, Family)';

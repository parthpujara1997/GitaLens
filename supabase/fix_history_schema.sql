-- Run this in your Supabase SQL Editor
ALTER TABLE public.history 
ADD COLUMN IF NOT EXISTS messages JSONB;

-- Update the comments/description if needed
COMMENT ON COLUMN public.history.messages IS 'Stores the full conversation history as a JSON array';

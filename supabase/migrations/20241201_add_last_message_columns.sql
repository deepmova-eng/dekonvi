-- Add last_message and last_message_at columns to conversations table
-- These columns are used to display message previews in the sidebar

ALTER TABLE IF EXISTS public.conversations 
ADD COLUMN IF NOT EXISTS last_message TEXT,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- Create index for performance when sorting by last_message_at
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx 
ON public.conversations(last_message_at DESC);

-- Add comment to document the columns
COMMENT ON COLUMN public.conversations.last_message IS 'Preview text of the last message in the conversation';
COMMENT ON COLUMN public.conversations.last_message_at IS 'Timestamp of the last message, used for sorting conversations';

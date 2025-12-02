-- Migration: Allow message receivers to mark messages as read
-- Created: 2024-12-02
-- Purpose: Fix 400 Bad Request errors when marking messages as read
--          by allowing the receiver (non-sender participant) to UPDATE messages

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Enable update for receiver to mark as read" ON "public"."messages";

-- Create policy to allow receivers to mark messages as read
-- Note: messages table doesn't have receiver_id, so we check:
--       1. User is part of the conversation (user1_id OR user2_id)
--       2. User is NOT the sender
CREATE POLICY "Enable update for receiver to mark as read"
ON "public"."messages"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    AND messages.sender_id != auth.uid()  -- Must be the receiver (not sender)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    AND messages.sender_id != auth.uid()
  )
);

-- Add comment for documentation
COMMENT ON POLICY "Enable update for receiver to mark as read" ON "public"."messages" 
IS 'Allows message receivers (conversation participants who are not the sender) to update messages (primarily to mark as read)';

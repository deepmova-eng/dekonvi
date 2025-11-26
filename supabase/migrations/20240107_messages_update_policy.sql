-- Add UPDATE policy for messages (mark as read)
-- This allows users to mark messages as read in their conversations

-- Drop existing update policy if any
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON messages;

-- Create UPDATE policy
CREATE POLICY "Users can update messages in own conversations"
ON messages FOR UPDATE
TO authenticated
USING (
  -- Can only update messages in conversations where user is a participant
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
  )
)
WITH CHECK (
  -- Can only update messages in conversations where user is a participant
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
  )
);

-- Verify the policy was created
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY policyname;

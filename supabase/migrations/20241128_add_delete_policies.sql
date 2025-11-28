-- ============================================
-- ADD DELETE POLICIES FOR CONVERSATIONS AND MESSAGES
-- ============================================

-- Drop existing delete policies if any
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- ============================================
-- MESSAGES: Allow users to delete messages in their conversations
-- ============================================

CREATE POLICY "Users can delete messages in own conversations"
ON messages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
  )
);

-- ============================================
-- CONVERSATIONS: Allow users to delete their own conversations
-- ============================================

CREATE POLICY "Users can delete own conversations"
ON conversations FOR DELETE
TO authenticated
USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages')
  AND cmd = 'DELETE'
ORDER BY tablename, policyname;

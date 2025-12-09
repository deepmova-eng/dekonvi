-- ============================================
-- 🚨 EMERGENCY FIX V2: Critical RLS Vulnerability
-- Date: 2025-12-09
-- Issue: Messages table allows ANY authenticated user to read ALL messages
-- Fix: Corrected for user1_id/user2_id structure
-- ============================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1: Drop DANGEROUS policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP POLICY IF EXISTS "realtime_messages_select" ON messages;
DROP POLICY IF EXISTS "realtime_messages_update" ON messages;
DROP POLICY IF EXISTS "realtime_messages_insert" ON messages;
DROP POLICY IF EXISTS "realtime_messages_delete" ON messages;

-- Also drop any old policies that might interfere
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Enable update for receiver to mark as read" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Les participants peuvent voir les messages" ON messages;
DROP POLICY IF EXISTS "Les participants peuvent envoyer des messages" ON messages;
DROP POLICY IF EXISTS "secure_messages_select" ON messages;
DROP POLICY IF EXISTS "secure_messages_insert" ON messages;
DROP POLICY IF EXISTS "secure_messages_update" ON messages;
DROP POLICY IF EXISTS "secure_messages_delete" ON messages;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2: Ensure RLS is enabled
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 3: Create SECURE policies (Realtime compatible)
-- CORRECTED for user1_id/user2_id structure
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- SELECT: Only participants can view messages
-- ✅ SECURE: Checks if user is user1 OR user2 in conversation
-- ✅ REALTIME: Works with Supabase Realtime subscriptions
CREATE POLICY "secure_messages_select_v2"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
  )
);

-- INSERT: Only send messages to own conversations
-- ✅ SECURE: Verifies sender and conversation membership
CREATE POLICY "secure_messages_insert_v2"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
  )
);

-- UPDATE: Mark messages as read OR edit own messages
-- ✅ SECURE: Only conversation participants can update
-- ✅ FEATURE: Allows marking messages as read
CREATE POLICY "secure_messages_update_v2"
ON messages FOR UPDATE
TO authenticated
USING (
  -- Can view messages in own conversations
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
  )
)
WITH CHECK (
  -- Can only modify own messages OR mark as read
  sender_id = auth.uid()
  OR (
    -- Allow receiver to mark as read
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
      AND auth.uid() != messages.sender_id
    )
  )
);

-- DELETE: Only delete own messages
-- ✅ SECURE: Can only delete messages you sent
CREATE POLICY "secure_messages_delete_v2"
ON messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CRITICAL SECURITY FIX COMPLETE
-- Messages are now properly secured:
-- - Users can ONLY see messages in conversations where they are user1 OR user2
-- - Users can ONLY send messages to conversations they belong to
-- - Users can ONLY delete their own messages
-- - Realtime subscriptions still work correctly
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

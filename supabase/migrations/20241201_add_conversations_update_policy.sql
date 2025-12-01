-- Add RLS policy to allow users to update their own conversations
-- This is needed for updating last_message and last_message_at fields

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;

-- Create new policy allowing conversation participants to update
CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
)
WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Verify the policy was created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'conversations' AND policyname = 'Users can update their own conversations';

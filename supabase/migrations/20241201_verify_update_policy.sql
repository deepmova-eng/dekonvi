-- Verify and recreate RLS policy for conversation updates
-- This ensures users can update conversations they participate in

-- First, drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.conversations;

-- Create the correct UPDATE policy
CREATE POLICY "Enable update for users based on user_id" 
ON public.conversations
FOR UPDATE 
USING (
  (auth.uid() = user1_id) OR (auth.uid() = user2_id)
)
WITH CHECK (
  (auth.uid() = user1_id) OR (auth.uid() = user2_id)
);

-- Verify the policy was created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'conversations' 
AND cmd = 'UPDATE';

-- ============================================
-- SOFT DELETE FOR CONVERSATIONS
-- ============================================
-- Instead of deleting conversations, we track which user has "deleted" it

-- 1. CREATE TABLE conversation_deletions
CREATE TABLE IF NOT EXISTS conversation_deletions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Un utilisateur ne peut supprimer qu'une fois la même conversation
  UNIQUE(conversation_id, user_id)
);

-- 2. INDEX FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_conversation_deletions_user ON conversation_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_deletions_conversation ON conversation_deletions(conversation_id);

-- 3. ENABLE RLS
ALTER TABLE conversation_deletions ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES

-- Users can view their own deletions
CREATE POLICY "Users can view own deletions"
ON conversation_deletions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create deletions (soft delete)
CREATE POLICY "Users can create deletions"
ON conversation_deletions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can remove their deletions (un-delete)
CREATE POLICY "Users can remove deletions"
ON conversation_deletions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. VERIFICATION
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'conversation_deletions'
ORDER BY policyname;

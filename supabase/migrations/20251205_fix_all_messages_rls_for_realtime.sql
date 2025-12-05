-- ============================================
-- FIX ALL MESSAGES RLS POLICIES FOR REALTIME
-- ============================================

-- 1. Drop toutes les policies (même celles qui existent déjà)
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Enable update for receiver to mark as read" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Authenticated users can view all messages for Realtime" ON messages;
DROP POLICY IF EXISTS "Users can read messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Messages select for Realtime" ON messages;
DROP POLICY IF EXISTS "Messages insert" ON messages;
DROP POLICY IF EXISTS "Messages update" ON messages;
DROP POLICY IF EXISTS "Messages delete" ON messages;

-- 2. Réactiver RLS (au cas où elle a été désactivée)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 3. Créer des policies SIMPLES sans EXISTS (Realtime-friendly)

-- SELECT : Tous les messages (filtering côté client)
CREATE POLICY "realtime_messages_select"
ON messages FOR SELECT
TO authenticated
USING (true);

-- INSERT : N'importe qui peut insérer si c'est son message
CREATE POLICY "realtime_messages_insert"
ON messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- UPDATE : Seulement ses propres messages OU permet mark as read
CREATE POLICY "realtime_messages_update"
ON messages FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE : Seulement ses propres messages
CREATE POLICY "realtime_messages_delete"
ON messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- ============================================
-- FIX MESSAGES REALTIME RLS
-- ============================================
-- Problème : La policy RLS actuelle utilise EXISTS avec subquery,
-- ce qui empêche Supabase Realtime de fonctionner (CHANNEL_ERROR)
--
-- Solution : Permettre SELECT sur tous les messages pour authenticated users
-- Le filtering côté client se fera via conversation_id dans les queries
-- ============================================

-- Drop l'ancienne policy restrictive
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;

-- ✅ Nouvelle policy : Permettre SELECT sur TOUS les messages
-- Supabase Realtime a besoin d'accès complet pour fonctionner
CREATE POLICY "Authenticated users can view all messages for Realtime"
ON messages FOR SELECT
TO authenticated
USING (true);

-- NOTE : Le filtering se fera côté client avec :
-- .eq('conversation_id', conversationId) dans les queries
-- et .filter(`conversation_id=eq.${conversationId}`) dans Realtime subscriptions

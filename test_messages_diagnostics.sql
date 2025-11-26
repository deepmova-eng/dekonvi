-- DIAGNOSTIC SCRIPT POUR LES MESSAGES
-- Exécutez ce script dans le SQL Editor de Supabase

-- 1. Vérifier si la table conversations existe et sa structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- 2. Vérifier les données brutes dans conversations
SELECT 
    id,
    listing_id,
    user1_id,
    user2_id,
    last_message,
    created_at
FROM conversations
ORDER BY created_at DESC
LIMIT 10;

-- 3. Vérifier les politiques RLS sur conversations
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'conversations'
ORDER BY policyname;

-- 4. Vérifier si RLS est activé
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'conversations';

-- 5. Tester une requête SELECT avec votre user ID
-- REMPLACEZ 'YOUR_USER_ID' par votre vrai ID
-- SELECT 
--     c.id,
--     c.listing_id,
--     c.user1_id,
--     c.user2_id,
--     c.last_message
-- FROM conversations c
-- WHERE c.user1_id = 'YOUR_USER_ID' OR c.user2_id = 'YOUR_USER_ID'
-- ORDER BY c.updated_at DESC;

-- 6. Voir toutes vos conversations (si connecté)
SELECT 
    c.id,
    c.listing_id,
    c.user1_id,
    c.user2_id,
    c.last_message,
    c.created_at,
    l.title as listing_title
FROM conversations c
LEFT JOIN listings l ON l.id = c.listing_id
WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
ORDER BY c.updated_at DESC;

-- 7. Compter vos conversations
SELECT COUNT(*) as total_conversations
FROM conversations
WHERE user1_id = auth.uid() OR user2_id = auth.uid();

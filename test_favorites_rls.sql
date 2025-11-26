-- TEST SCRIPT POUR DIAGNOSTIQUER LES FAVORIS
-- Exécutez ce script dans le SQL Editor de Supabase

-- 1. Vérifier les données brutes dans la table favorites
SELECT 
    'Total favorites in table' as test,
    COUNT(*) as count
FROM favorites;

-- 2. Vérifier les politiques RLS sur la table favorites
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'favorites'
ORDER BY policyname;

-- 3. Vérifier si RLS est activé
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'favorites';

-- 4. Tester une requête SELECT typique (remplacez les UUIDs par les vôtres)
-- IMPORTANT: Remplacez 'YOUR_USER_ID' et 'YOUR_LISTING_ID' par des valeurs réelles
-- SELECT 
--     id,
--     user_id,
--     listing_id,
--     created_at
-- FROM favorites
-- WHERE user_id = 'YOUR_USER_ID' 
--   AND listing_id = 'YOUR_LISTING_ID';

-- 5. Voir tous vos favoris (si connecté)
SELECT 
    f.id,
    f.user_id,
    f.listing_id,
    f.created_at,
    l.title as listing_title
FROM favorites f
LEFT JOIN listings l ON l.id = f.listing_id
WHERE f.user_id = auth.uid()
ORDER BY f.created_at DESC;

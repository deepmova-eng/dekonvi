-- ═══════════════════════════════════════════════════════════
-- DIAGNOSTIC : Structure de premium_requests et Foreign Keys
-- Date: 2024-12-03
-- Objectif: Vérifier les colonnes et relations pour corriger les 400 Bad Request
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. STRUCTURE DE LA TABLE
-- ═══════════════════════════════════════════════════════════

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'premium_requests'
ORDER BY ordinal_position;

-- Résultat attendu : id, user_id, listing_id, status, duration, price, created_at, etc.

-- ═══════════════════════════════════════════════════════════
-- 2. FOREIGN KEYS ET RELATIONS
-- ═══════════════════════════════════════════════════════════

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'premium_requests'
ORDER BY tc.constraint_name;

-- Résultat attendu :
-- premium_requests_user_id_fkey | premium_requests | user_id | profiles | id
-- premium_requests_listing_id_fkey | premium_requests | listing_id | listings | id

-- ═══════════════════════════════════════════════════════════
-- 3. TESTER LA REQUÊTE EXACTE DU FRONTEND
-- ═══════════════════════════════════════════════════════════

-- Simuler la requête du frontend
SELECT 
  *,
  profiles:user_id (
    name,
    email
  ),
  listings:listing_id (
    title
  )
FROM premium_requests
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Si cette requête échoue, noter l'erreur exacte

-- ═══════════════════════════════════════════════════════════
-- 4. VÉRIFIER LES DONNÉES EXISTANTES
-- ═══════════════════════════════════════════════════════════

SELECT * FROM premium_requests ORDER BY created_at DESC LIMIT 5;

-- Si des lignes existent, vérifier que user_id et listing_id sont bien remplis

-- ═══════════════════════════════════════════════════════════
-- FIN DU DIAGNOSTIC
-- Partagez les résultats pour identifier le problème exact
-- ═══════════════════════════════════════════════════════════

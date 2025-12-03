-- ═══════════════════════════════════════════════════════════
-- TEST DIAGNOSTIC : Insertion directe dans favorites
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Récupérer un utilisateur et une annonce existants
DO $$
DECLARE
  test_user_id UUID;
  test_listing_id UUID;
BEGIN
  -- Récupérer le premier utilisateur
  SELECT id INTO test_user_id FROM public.profiles ORDER BY created_at LIMIT 1;
  
  -- Récupérer une annonce qui n'appartient PAS à cet utilisateur
  SELECT id INTO test_listing_id 
  FROM public.listings 
  WHERE seller_id != test_user_id 
  AND status = 'active'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE 'User ID sélectionné : %', test_user_id;
  RAISE NOTICE 'Listing ID sélectionné : %', test_listing_id;
  RAISE NOTICE '════════════════════════════════════════════════════';
  
  -- Afficher les IDs pour que vous puissiez les copier
  RAISE NOTICE '';
  RAISE NOTICE 'Copiez ces IDs pour le test manuel :';
  RAISE NOTICE 'INSERT INTO public.favorites (user_id, listing_id)';
  RAISE NOTICE 'VALUES (''%'', ''%'');', test_user_id, test_listing_id;
  RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 2 : Afficher les détails pour diagnostic
-- ═══════════════════════════════════════════════════════════

-- Vérifier le nombre de favoris actuels
SELECT 
  COUNT(*) as total_favorites,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(DISTINCT listing_id) as total_listings
FROM public.favorites;

-- Vérifier les contraintes sur la table
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.favorites'::regclass
ORDER BY conname;

-- Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'favorites';

-- Lister les politiques RLS actuelles
SELECT 
  policyname,
  cmd as command,
  permissive,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'favorites'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 3 : TEST MANUEL - Copiez l'INSERT ci-dessous
-- et remplacez les IDs par ceux affichés dans ÉTAPE 1
-- ═══════════════════════════════════════════════════════════

-- Attention : Cette requête va échouer car les IDs ne sont pas remplacés
-- Utilisez les IDs affichés par le DO block ci-dessus

-- INSERT INTO public.favorites (user_id, listing_id)
-- VALUES ('REMPLACEZ_PAR_USER_ID', 'REMPLACEZ_PAR_LISTING_ID');

-- Si cette insertion ÉCHOUE, le message d'erreur vous dira EXACTEMENT
-- quel est le problème (foreign key, RLS, unique constraint, etc.)

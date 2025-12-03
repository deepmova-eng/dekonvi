-- ═══════════════════════════════════════════════════════════
-- FIX URGENT : Récursion infinie dans RLS admin listings
-- Date: 2024-12-03
-- Objectif: Corriger infinite recursion detected in policy for "listings"
-- ═══════════════════════════════════════════════════════════

-- PROBLÈME :
-- La policy admin UPDATE interroge profiles pour vérifier le rôle,
-- ce qui déclenche les policies de profiles, qui peuvent interroger listings,
-- créant une boucle infinie.

-- SOLUTION :
-- Créer une fonction SECURITY DEFINER is_admin() qui bypasse les RLS
-- lors de sa vérification.

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 1 : Supprimer les policies UPDATE problématiques
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Admins can update all listings including status" ON public.listings;
DROP POLICY IF EXISTS "Users can update their listings except status" ON public.listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Sellers can update own listings (no status change)" ON public.listings;

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 2 : Créer la fonction is_admin() SECURITY DEFINER
-- ═══════════════════════════════════════════════════════════

-- Cette fonction s'exécute avec les privilèges du créateur (DEFINER),
-- ce qui bypasse les RLS policies et évite la récursion
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 3 : Policy Admin - Simple et sans récursion
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "Admins can update everything"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING ( auth.is_admin() )
  WITH CHECK ( auth.is_admin() );

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 4 : Policy Vendeur - Update limité (pas de status change)
-- ═══════════════════════════════════════════════════════════

CREATE POLICY "Sellers can update own listings (no status change)"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING ( seller_id = auth.uid() )
  WITH CHECK ( 
    seller_id = auth.uid() 
    AND status = 'pending' -- Le statut reste pending si le vendeur modifie
  );

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Vérifier que la fonction existe
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'is_admin';

-- Vérifier les policies UPDATE
SELECT 
  policyname,
  cmd as command,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'listings'
AND cmd = 'UPDATE'
ORDER BY policyname;

-- Résultat attendu : 2 policies
-- - Admins can update everything (USING: is_admin())
-- - Sellers can update own listings (no status change)

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- La récursion infinie est résolue ! Admin peut maintenant approuver ✅
-- ═══════════════════════════════════════════════════════════

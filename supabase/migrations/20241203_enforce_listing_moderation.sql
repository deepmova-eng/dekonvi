-- ═══════════════════════════════════════════════════════════
-- FIX URGENT : Forcer la modération des annonces
-- Date: 2024-12-03
-- Objectif: Empêcher les annonces de s'auto-publier sans validation admin
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- FIX 1 : Forcer le statut par défaut à 'pending'
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.listings 
ALTER COLUMN status SET DEFAULT 'pending';

-- Vérification
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'listings' 
AND column_name = 'status';
-- Résultat attendu : 'pending'::text

-- ═══════════════════════════════════════════════════════════
-- FIX 2 : Trigger pour forcer 'pending' à l'insertion
-- ═══════════════════════════════════════════════════════════

-- Ce trigger empêche les utilisateurs de s'auto-valider en envoyant status='active'
CREATE OR REPLACE FUNCTION public.force_listing_pending_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Force le statut à 'pending' pour toute nouvelle annonce
  -- Sauf si l'utilisateur est admin (optionnel, à activer si besoin)
  NEW.status := 'pending';
  
  RAISE NOTICE 'Nouvelle annonce forcée en statut pending : %', NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attacher le trigger
DROP TRIGGER IF EXISTS enforce_pending_status ON public.listings;
CREATE TRIGGER enforce_pending_status
  BEFORE INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.force_listing_pending_on_insert();

-- ═══════════════════════════════════════════════════════════
-- FIX 3 : RLS Policy - Interdire la modification du status
-- ═══════════════════════════════════════════════════════════

-- Supprimer l'ancienne policy d'insert si elle existe
DROP POLICY IF EXISTS "Users can create listings" ON public.listings;

-- Nouvelle policy INSERT : interdit de définir un status autre que 'pending'
CREATE POLICY "Users can create listings with pending status"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = seller_id 
    AND (status IS NULL OR status = 'pending')
  );

-- Policy UPDATE : seuls les admins peuvent changer le status
DROP POLICY IF EXISTS "Users can update their listings" ON public.listings;

CREATE POLICY "Users can update their listings except status"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (
    auth.uid() = seller_id
    -- Empêche la modification du status (il reste tel quel)
    AND status = (SELECT status FROM public.listings WHERE id = listings.id)
  );

-- Policy pour les admins : peuvent tout modifier
CREATE POLICY "Admins can update all listings including status"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Vérifier les policies
SELECT 
  policyname,
  cmd as command,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'listings'
ORDER BY policyname;

-- Vérifier le trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'listings'
AND trigger_name = 'enforce_pending_status';

-- ═══════════════════════════════════════════════════════════
-- TEST (Optionnel)
-- ═══════════════════════════════════════════════════════════

/*
-- Test 1 : Essayer de créer une annonce avec status='active' (doit échouer ou être forcée à pending)
-- Connectez-vous en tant qu'utilisateur normal, puis :

INSERT INTO public.listings (seller_id, title, price, status)
VALUES (auth.uid(), 'Test Auto-Validation', 100, 'active');

-- Vérifier le statut (doit être 'pending')
SELECT id, title, status FROM public.listings WHERE title = 'Test Auto-Validation';

-- Nettoyer
DELETE FROM public.listings WHERE title = 'Test Auto-Validation';
*/

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Les annonces passent maintenant OBLIGATOIREMENT par la modération ! 🔒
-- ═══════════════════════════════════════════════════════════

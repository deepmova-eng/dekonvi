-- ═══════════════════════════════════════════════════════════
-- FIX URGENT : Forcer la modération des annonces (CORRECTED)
-- Date: 2024-12-03
-- Objectif: Empêcher les annonces de s'auto-publier sans validation admin
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- FIX 1 : Forcer le statut par défaut à 'pending'
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.listings 
ALTER COLUMN status SET DEFAULT 'pending';

-- ═══════════════════════════════════════════════════════════
-- FIX 2 : Trigger pour forcer 'pending' à l'insertion
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.force_listing_pending_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Force le statut à 'pending' pour toute nouvelle annonce
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
-- FIX 3 : RLS Policies - DROP puis CREATE
-- ═══════════════════════════════════════════════════════════

-- Supprimer les anciennes policies d'insert
DROP POLICY IF EXISTS "Users can create listings" ON public.listings;
DROP POLICY IF EXISTS "Users can create listings with pending status" ON public.listings;

-- Nouvelle policy INSERT : interdit de définir un status autre que 'pending'
CREATE POLICY "Users can create listings with pending status"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = seller_id 
    AND (status IS NULL OR status = 'pending')
  );

-- Supprimer l'ancienne policy d'update
DROP POLICY IF EXISTS "Users can update their listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update their listings except status" ON public.listings;

-- Policy UPDATE : empêche la modification du status
CREATE POLICY "Users can update their listings except status"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (
    auth.uid() = seller_id
    -- Le status ne peut pas être modifié par l'utilisateur
    AND status = (SELECT status FROM public.listings WHERE id = listings.id)
  );

-- Supprimer l'ancienne policy admin
DROP POLICY IF EXISTS "Admins can update all listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can update all listings including status" ON public.listings;

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

-- Vérifier le default
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'listings' 
AND column_name = 'status';

-- Vérifier les policies
SELECT 
  policyname,
  cmd as command
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
-- FIN DE LA MIGRATION
-- Les annonces passent maintenant OBLIGATOIREMENT par la modération ! 🔒
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- Listing Edit Moderation Workflow
-- Date: 2024-12-04
-- Objectif: Forcer la re-modération des annonces lors de modifications significatives
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- FIX 1 : Trigger pour forcer 'pending' lors de modifications significatives
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.force_pending_on_significant_listing_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le status est changé par un admin, on ne touche pas
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN NEW;
  END IF;

  -- Si c'est une modification significative (titre, prix, description, images)
  -- alors on force le retour en pending
  IF (
    OLD.title != NEW.title 
    OR OLD.description != NEW.description 
    OR OLD.price != NEW.price 
    OR OLD.images != NEW.images
    OR OLD.category != NEW.category
  ) THEN
    NEW.status := 'pending';
    RAISE NOTICE 'Annonce % modifiée, retour en statut pending pour re-validation', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attacher le trigger
DROP TRIGGER IF EXISTS force_pending_on_edit ON public.listings;
CREATE TRIGGER force_pending_on_edit
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.force_pending_on_significant_listing_edit();

-- ═══════════════════════════════════════════════════════════
-- FIX 2 : Modifier la RLS policy pour permettre le changement vers 'pending'
-- ═══════════════════════════════════════════════════════════

-- Supprimer l'ancienne policy restrictive
DROP POLICY IF EXISTS "Users can update their listings except status" ON public.listings;

-- Nouvelle policy : permet à l'utilisateur de modifier son annonce
-- Le trigger s'occupera automatiquement de remettre le statut en pending
CREATE POLICY "Users can update their listings with auto-pending"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (
    auth.uid() = seller_id
    -- L'utilisateur peut modifier son annonce, le trigger gérera le status
  );

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Vérifier le trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'listings'
AND trigger_name = 'force_pending_on_edit';

-- Vérifier les policies
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'listings'
AND policyname LIKE '%update%'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════
-- COMMENTAIRES
-- ═══════════════════════════════════════════════════════════

COMMENT ON FUNCTION public.force_pending_on_significant_listing_edit() IS 
'Trigger function qui force le retour en statut pending lors de modifications significatives d''une annonce (titre, prix, description, images, catégorie). Les admins ne sont pas affectés par cette restriction.';

COMMENT ON TRIGGER force_pending_on_edit ON public.listings IS
'Déclenche la re-modération (statut pending) lors de modifications significatives d''une annonce par un utilisateur normal';

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Les annonces modifiées passent automatiquement en re-modération ! 🔒
-- ═══════════════════════════════════════════════════════════

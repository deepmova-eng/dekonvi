-- ═══════════════════════════════════════════════════════════
-- TRIGGER : Notification quand un avis est approuvé
-- Date: 2024-12-03
-- Objectif: Notifier le vendeur quand son avis passe en statut "approved"
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Créer la fonction de notification
CREATE OR REPLACE FUNCTION public.notify_review_approved()
RETURNS TRIGGER AS $$
DECLARE
  reviewer_name TEXT;
BEGIN
  -- Ne déclencher QUE si le statut passe de non-approved à approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Récupérer le nom du reviewer
    SELECT name INTO reviewer_name
    FROM public.profiles
    WHERE id = NEW.reviewer_id;
    
    -- Insérer la notification pour le vendeur
    -- Utilisez un bloc BEGIN/EXCEPTION pour ne pas bloquer la validation en cas d'erreur
    BEGIN
      INSERT INTO public.notifications (user_id, type, title, content, link, read)
      VALUES (
        NEW.seller_id,                                         -- Le vendeur qui reçoit l'avis
        'review',                                              -- Type
        '⭐ Nouvel avis reçu !',                               -- Titre
        COALESCE(reviewer_name, 'Quelqu''un') || ' vous a laissé un avis de ' || NEW.rating || '/5 étoiles',  -- Contenu
        '/profile',                                            -- Lien vers le profil du vendeur
        false                                                  -- Non lu
      );
      
      RAISE NOTICE 'Notification envoyée au vendeur % pour l''avis approuvé', NEW.seller_id;
    EXCEPTION WHEN OTHERS THEN
      -- Si la notification échoue, on log mais on NE BLOQUE PAS la validation de l'avis
      RAISE WARNING 'Erreur lors de la création de la notification d''avis approuvé: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 2 : Créer le trigger sur UPDATE
DROP TRIGGER IF EXISTS on_review_approved ON public.reviews;
CREATE TRIGGER on_review_approved
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_review_approved();

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Vérifier que le trigger est actif
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_review_approved'
AND event_object_table = 'reviews';

-- Si vous voyez une ligne, le trigger est actif ! ✅

-- ═══════════════════════════════════════════════════════════
-- TEST (Optionnel - Décommentez pour tester)
-- ═══════════════════════════════════════════════════════════

/*
-- 1. Vérifier qu'il y a des avis en pending
SELECT id, seller_id, reviewer_id, rating, status 
FROM public.reviews 
WHERE status = 'pending' 
LIMIT 1;

-- 2. Approuver un avis (remplacer 'your-review-id' par un vrai ID)
-- UPDATE public.reviews 
-- SET status = 'approved' 
-- WHERE id = 'your-review-id';

-- 3. Vérifier que la notification a été créée
-- SELECT * FROM public.notifications 
-- WHERE type = 'review' 
-- ORDER BY created_at DESC 
-- LIMIT 5;
*/

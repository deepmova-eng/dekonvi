-- ═══════════════════════════════════════════════════════════
-- NOTIFICATIONS : Validation/Rejet Annonces & Approbation Premium
-- Date: 2024-12-03
-- Objectif: Automatiser la communication Admin → Utilisateur
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- TRIGGER 1 : Notification de changement de statut d'annonce
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_listing_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Cas 1 : Annonce Validée (Active)
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    BEGIN
      INSERT INTO public.notifications (user_id, type, title, content, link, read)
      VALUES (
        NEW.seller_id,
        'system', -- ou 'alert'
        'Annonce validée ! 🚀',
        'Votre annonce "' || LEFT(NEW.title, 30) || '..." est maintenant en ligne.',
        '/listings/' || NEW.id,
        false
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't block listing update
      RAISE WARNING 'Erreur lors de la création de la notification de validation d''annonce: %', SQLERRM;
    END;
  
  -- Cas 2 : Annonce Refusée (Rejected)
  ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    BEGIN
      INSERT INTO public.notifications (user_id, type, title, content, link, read)
      VALUES (
        NEW.seller_id,
        'alert',
        'Annonce refusée 🛑',
        'Votre annonce "' || LEFT(NEW.title, 30) || '..." a été refusée par la modération.',
        '/profile', -- Redirection vers le tableau de bord
        false
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't block listing update
      RAISE WARNING 'Erreur lors de la création de la notification de rejet d''annonce: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attacher le trigger aux Listings
DROP TRIGGER IF EXISTS on_listing_status_change ON public.listings;
CREATE TRIGGER on_listing_status_change
  AFTER UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_listing_status_change();

-- ═══════════════════════════════════════════════════════════
-- TRIGGER 2 : Notification d'approbation Premium
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_premium_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    BEGIN
      INSERT INTO public.notifications (user_id, type, title, content, link, read)
      VALUES (
        NEW.user_id,
        'premium',
        'Bienvenue en Premium ! 💎',
        'Votre demande a été acceptée. Vous avez maintenant accès aux fonctionnalités exclusives.',
        '/create-premium',
        false
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't block premium request update
      RAISE WARNING 'Erreur lors de la création de la notification premium: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attacher le trigger aux Demandes Premium
DROP TRIGGER IF EXISTS on_premium_approved ON public.premium_requests;
CREATE TRIGGER on_premium_approved
  AFTER UPDATE ON public.premium_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_premium_approved();

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Vérifier que les triggers sont actifs
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name IN ('on_listing_status_change', 'on_premium_approved')
ORDER BY event_object_table, trigger_name;

-- Résultat attendu : 2 lignes
-- - on_listing_status_change | listings | UPDATE | AFTER
-- - on_premium_approved | premium_requests | UPDATE | AFTER

-- ═══════════════════════════════════════════════════════════
-- TEST (Optionnel - Décommentez pour tester)
-- ═══════════════════════════════════════════════════════════

/*
-- TEST 1 : Valider une annonce en pending
-- 1. Trouver une annonce en pending
SELECT id, seller_id, title, status FROM public.listings WHERE status = 'pending' LIMIT 1;

-- 2. La valider (remplacer l'ID)
UPDATE public.listings SET status = 'active' WHERE id = 'YOUR-LISTING-ID';

-- 3. Vérifier la notification
SELECT * FROM public.notifications WHERE type = 'system' ORDER BY created_at DESC LIMIT 1;


-- TEST 2 : Approuver une demande premium
-- 1. Trouver une demande en pending
SELECT id, user_id, status FROM public.premium_requests WHERE status = 'pending' LIMIT 1;

-- 2. L'approuver (remplacer l'ID)
UPDATE public.premium_requests SET status = 'approved' WHERE id = 'YOUR-REQUEST-ID';

-- 3. Vérifier la notification
SELECT * FROM public.notifications WHERE type = 'premium' ORDER BY created_at DESC LIMIT 1;
*/

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Module de notifications 100% complet ! 🔒
-- ═══════════════════════════════════════════════════════════

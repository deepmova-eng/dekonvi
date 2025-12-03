-- ═══════════════════════════════════════════════════════════
-- RÉACTIVATION DU TRIGGER DE NOTIFICATIONS FAVORIS
-- Date: 2024-12-03
-- Objectif: Réactiver les notifications quand un article est liké
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Supprimer l'ancien trigger (s'il existe)
DROP TRIGGER IF EXISTS on_favorite_added ON public.favorites;

-- ÉTAPE 2 : Recréer la fonction avec gestion d'erreurs SAFE
CREATE OR REPLACE FUNCTION public.notify_favorite()
RETURNS TRIGGER AS $$
DECLARE
  listing_title TEXT;
  listing_owner_id UUID;
  user_name TEXT;
BEGIN
  -- Récupérer le titre et le vendeur de l'article
  -- BEGIN/EXCEPTION pour ne JAMAIS bloquer l'ajout de favoris
  BEGIN
    SELECT title, seller_id INTO listing_title, listing_owner_id
    FROM public.listings
    WHERE id = NEW.listing_id;
    
    -- Récupérer le nom de l'utilisateur qui a liké
    SELECT name INTO user_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Ne pas notifier si on like son propre article
    IF listing_owner_id IS NOT NULL AND listing_owner_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, content, link, read)
      VALUES (
        listing_owner_id,                                           -- Le vendeur de l'article
        'favorite',                                                  -- Type
        '❤️ Nouveau favori !',                                      -- Titre
        COALESCE(user_name, 'Quelqu''un') || ' a aimé votre article : ' || COALESCE(listing_title, 'Article'),  -- Message
        '/listings/' || NEW.listing_id,                             -- Lien vers l'article
        false                                                        -- Non lu
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Si la notification échoue, on log l'erreur mais on NE BLOQUE PAS le favori
    RAISE WARNING 'Erreur lors de la création de la notification de favori: %', SQLERRM;
  END;
  
  -- TOUJOURS retourner NEW pour ne jamais bloquer l'insertion
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 3 : Recréer le trigger
CREATE TRIGGER on_favorite_added
  AFTER INSERT ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_favorite();

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION : Confirmer que le trigger est actif
-- ═══════════════════════════════════════════════════════════

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_favorite_added'
AND event_object_table = 'favorites';

-- Si vous voyez une ligne dans les résultats, le trigger est ACTIF ✅
-- Sinon, il y a eu un problème ❌

-- FIX: Corriger le trigger de favoris qui bloque les insertions
-- Le problème est probablement lié aux permissions SECURITY DEFINER

-- Recréer le trigger avec une meilleure gestion d'erreurs
CREATE OR REPLACE FUNCTION public.notify_favorite()
RETURNS TRIGGER AS $$
DECLARE
  listing_title TEXT;
  listing_owner_id UUID;
  user_name TEXT;
BEGIN
  -- Récupérer le titre et le vendeur de l'article
  -- Utiliser BEGIN/EXCEPTION pour ne pas bloquer si ça échoue
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
        listing_owner_id,
        'favorite',
        '❤️ Nouveau favori !',
        COALESCE(user_name, 'Quelqu''un') || ' a aimé votre article : ' || COALESCE(listing_title, 'Article'),
        '/listings/' || NEW.listing_id,
        false
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Si la notification échoue, on log l'erreur mais on ne bloque pas le favori
    RAISE WARNING 'Erreur lors de la création de la notification de favori: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifier que le trigger existe
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_favorite_added';

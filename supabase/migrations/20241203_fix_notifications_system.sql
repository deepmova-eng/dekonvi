-- ═══════════════════════════════════════════════════════════
-- MIGRATION: Réparation du Système de Notifications
-- Date: 2024-12-03
-- Objectif: Standardiser sur le schéma actuel et créer triggers manquants
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Mettre à jour la contrainte de TYPE sur la table notifications
-- Le schéma actuel rejette 'favorite' et 'review'. Il faut les autoriser.
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('message', 'system', 'alert', 'premium', 'favorite', 'review'));


-- ÉTAPE 2 : Créer le Trigger pour les NOUVEAUX MESSAGES (Priorité Absolue)
-- Crée une notif quand un message est inséré
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  conversation_listing_id UUID;
BEGIN
  -- Extraire le destinataire depuis la conversation
  -- user1_id et user2_id, on cherche celui qui n'est PAS le sender
  SELECT 
    CASE 
      WHEN user1_id = NEW.sender_id THEN user2_id
      ELSE user1_id
    END,
    listing_id
  INTO recipient_id, conversation_listing_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  -- Récupérer le nom de l'expéditeur
  SELECT name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Insérer la notification pour le destinataire
  IF recipient_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, content, link, read)
    VALUES (
      recipient_id,                                           -- Le destinataire du message
      'message',                                              -- Type
      'Nouveau message de ' || COALESCE(sender_name, 'un utilisateur'),  -- Titre
      LEFT(NEW.content, 100),                                -- Aperçu du message (100 premiers caractères)
      '/messages?conversation=' || NEW.conversation_id,      -- Lien vers la conversation
      false                                                   -- Non lu
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attacher le trigger
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();


-- ÉTAPE 3 : Réparer le Trigger FAVORIS (Adapté au nouveau schéma)
-- Remplace l'ancien trigger cassé
CREATE OR REPLACE FUNCTION public.notify_favorite()
RETURNS TRIGGER AS $$
DECLARE
  listing_title TEXT;
  listing_owner_id UUID;
  user_name TEXT;
BEGIN
  -- Récupérer le titre et le vendeur de l'article
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
      listing_owner_id,                                      -- Destinataire (Vendeur)
      'favorite',                                            -- Type (maintenant autorisé)
      '❤️ Nouveau favori !',
      COALESCE(user_name, 'Quelqu''un') || ' a aimé votre article : ' || COALESCE(listing_title, 'Article'),
      '/listings/' || NEW.listing_id,                        -- Lien vers l'article
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Réattacher le trigger proprement
DROP TRIGGER IF EXISTS on_favorite_added ON public.favorites;
CREATE TRIGGER on_favorite_added
  AFTER INSERT ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_favorite();


-- ÉTAPE 4 : Créer le Trigger pour les REVIEWS (Bonus)
-- Crée une notif quand un vendeur reçoit un avis
CREATE OR REPLACE FUNCTION public.handle_new_review()
RETURNS TRIGGER AS $$
DECLARE
  reviewer_name TEXT;
BEGIN
  -- Récupérer le nom du reviewer
  SELECT name INTO reviewer_name
  FROM public.profiles
  WHERE id = NEW.reviewer_id;

  -- Ne pas notifier si on s'auto-review (normalement impossible)
  IF NEW.seller_id != NEW.reviewer_id THEN
    INSERT INTO public.notifications (user_id, type, title, content, link, read)
    VALUES (
      NEW.seller_id,                                         -- Destinataire (Vendeur noté)
      'review',                                              -- Type
      '⭐ Nouvel avis reçu',
      COALESCE(reviewer_name, 'Un utilisateur') || ' vous a laissé un avis de ' || NEW.rating || '/5 étoiles',
      '/profile',                                            -- Lien vers le profil
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attacher le trigger pour les reviews
DROP TRIGGER IF EXISTS on_new_review ON public.reviews;
CREATE TRIGGER on_new_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_review();


-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 5 : Nettoyage - Supprimer les anciennes notifications cassées
-- (Optionnel - à décommenter si vous voulez nettoyer)
-- ═══════════════════════════════════════════════════════════

-- DELETE FROM public.notifications 
-- WHERE type = 'favorite' 
-- AND (recipient_id IS NOT NULL OR user_id IS NULL);

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- ═══════════════════════════════════════════════════════════

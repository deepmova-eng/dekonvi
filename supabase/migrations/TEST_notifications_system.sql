-- ═══════════════════════════════════════════════════════════
-- SCRIPT DE TEST : Système de Notifications
-- Date: 2024-12-03
-- Objectif: Vérifier que tous les triggers de notifications fonctionnent
-- ═══════════════════════════════════════════════════════════
-- ⚠️ ATTENTION: Ce script utilise des données de test réelles
-- Exécutez-le dans un environnement de développement/staging
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════
-- SETUP: Récupérer des utilisateurs existants pour les tests
-- ═══════════════════════════════════════════════════════════

-- Variables pour stocker les IDs des utilisateurs existants
DO $$
DECLARE
  alice_id UUID;
  bob_id UUID;
  charlie_id UUID;
  test_listing_id UUID;
  test_conversation_id UUID;
BEGIN
  RAISE NOTICE '╔═══════════════════════════════════════════════════╗';
  RAISE NOTICE '║ SETUP : Préparation des données de test          ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════╝';

  -- Nettoyer les anciennes données de test (si elles existent)
  DELETE FROM public.notifications WHERE link LIKE '%TEST_%' OR content LIKE '%TEST_%';
  DELETE FROM public.reviews WHERE comment LIKE '%TEST_%';
  DELETE FROM public.messages WHERE content LIKE '%TEST_%';
  DELETE FROM public.conversations WHERE listing_id IN (
    SELECT id FROM public.listings WHERE title LIKE 'TEST_%'
  );
  DELETE FROM public.favorites WHERE listing_id IN (
    SELECT id FROM public.listings WHERE title LIKE 'TEST_%'
  );
  DELETE FROM public.listings WHERE title LIKE 'TEST_%';

  -- Récupérer 3 utilisateurs existants (les 3 premiers trouvés)
  SELECT id INTO alice_id FROM public.profiles ORDER BY created_at LIMIT 1;
  SELECT id INTO bob_id FROM public.profiles WHERE id != alice_id ORDER BY created_at LIMIT 1;
  SELECT id INTO charlie_id FROM public.profiles WHERE id NOT IN (alice_id, bob_id) ORDER BY created_at LIMIT 1;

  -- Vérifier qu'on a bien 3 utilisateurs
  IF alice_id IS NULL OR bob_id IS NULL OR charlie_id IS NULL THEN
    RAISE EXCEPTION '❌ Erreur: Il faut au moins 3 utilisateurs dans la base pour exécuter ces tests. Créez des comptes via l''interface Supabase Auth.';
  END IF;

  RAISE NOTICE '✅ Utilisateurs sélectionnés:';
  RAISE NOTICE '   - Alice: %', alice_id;
  RAISE NOTICE '   - Bob: %', bob_id;
  RAISE NOTICE '   - Charlie: %', charlie_id;

  -- Créer une annonce de test (Alice est le vendeur)
  INSERT INTO public.listings (title, description, price, location, images, category, seller_id, status)
  VALUES (
    'TEST_Article de test', 
    'Ceci est une description de test pour valider le système de notifications. L''article est en excellent état et disponible immédiatement. Contactez-moi pour plus d''informations sur ce produit de qualité.', 
    100, 
    'Lomé', 
    ARRAY['test.jpg'], 
    'high-tech', 
    alice_id, 
    'active'
  )
  RETURNING id INTO test_listing_id;

  RAISE NOTICE '✅ Annonce de test créée: %', test_listing_id;

  -- Créer une conversation de test (Bob contacte Alice)
  INSERT INTO public.conversations (listing_id, user1_id, user2_id, created_at)
  VALUES (test_listing_id, bob_id, alice_id, NOW())
  RETURNING id INTO test_conversation_id;

  RAISE NOTICE '✅ Conversation de test créée: %', test_conversation_id;

  -- Stocker les IDs dans une table temporaire pour les tests suivants
  CREATE TEMP TABLE test_users (
    alice_id UUID,
    bob_id UUID,
    charlie_id UUID,
    test_listing_id UUID,
    test_conversation_id UUID
  );

  INSERT INTO test_users VALUES (alice_id, bob_id, charlie_id, test_listing_id, test_conversation_id);

  RAISE NOTICE '';
END $$;


-- ═══════════════════════════════════════════════════════════
-- TEST 1 : Trigger de MESSAGES
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  notif_count_before INTEGER;
  notif_count_after INTEGER;
  notif_record RECORD;
  alice_id UUID;
  bob_id UUID;
  test_conversation_id UUID;
BEGIN
  -- Récupérer les IDs depuis la table temporaire
  SELECT t.alice_id, t.bob_id, t.test_conversation_id 
  INTO alice_id, bob_id, test_conversation_id 
  FROM test_users t;

  RAISE NOTICE '╔═══════════════════════════════════════════════════╗';
  RAISE NOTICE '║ TEST 1 : Notification de Nouveau Message        ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════╝';

  -- Compter les notifications avant
  SELECT COUNT(*) INTO notif_count_before FROM public.notifications 
  WHERE user_id = alice_id;
  RAISE NOTICE 'Notifications AVANT: %', notif_count_before;

  -- Bob envoie un message à Alice
  INSERT INTO public.messages (conversation_id, sender_id, content, created_at) VALUES
    (test_conversation_id, bob_id, 'TEST_MESSAGE: Bonjour Alice, est-ce que l''article est toujours disponible ?', NOW());

  -- Attendre un instant pour que le trigger s'exécute
  PERFORM pg_sleep(0.1);

  -- Vérifier qu'une notification a été créée pour Alice
  SELECT COUNT(*) INTO notif_count_after FROM public.notifications 
  WHERE user_id = alice_id 
  AND type = 'message'
  AND content LIKE '%TEST_MESSAGE%';
  
  RAISE NOTICE 'Notifications APRÈS: %', notif_count_after;

  -- Récupérer la notification créée
  SELECT * INTO notif_record FROM public.notifications 
  WHERE user_id = alice_id 
  AND type = 'message'
  AND content LIKE '%TEST_MESSAGE%'
  ORDER BY created_at DESC
  LIMIT 1;

  IF notif_count_after > 0 THEN
    RAISE NOTICE '✅ TEST RÉUSSI: Notification créée !';
    RAISE NOTICE '   - Type: %', notif_record.type;
    RAISE NOTICE '   - Titre: %', notif_record.title;
    RAISE NOTICE '   - Contenu: %', LEFT(notif_record.content, 50) || '...';
    RAISE NOTICE '   - Lien: %', notif_record.link;
    RAISE NOTICE '   - Lu: %', notif_record.read;
  ELSE
    RAISE EXCEPTION '❌ TEST ÉCHOUÉ: Aucune notification créée pour le message !';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════
-- TEST 2 : Trigger de FAVORIS
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  notif_count_before INTEGER;
  notif_count_after INTEGER;
  notif_record RECORD;
  alice_id UUID;
  charlie_id UUID;
  test_listing_id UUID;
BEGIN
  -- Récupérer les IDs depuis la table temporaire
  SELECT t.alice_id, t.charlie_id, t.test_listing_id 
  INTO alice_id, charlie_id, test_listing_id 
  FROM test_users t;

  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════╗';
  RAISE NOTICE '║ TEST 2 : Notification de Favori                  ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════╝';

  -- Compter les notifications avant
  SELECT COUNT(*) INTO notif_count_before FROM public.notifications 
  WHERE user_id = alice_id 
  AND type = 'favorite';
  RAISE NOTICE 'Notifications favoris AVANT: %', notif_count_before;

  -- Charlie ajoute l'article d'Alice à ses favoris
  INSERT INTO public.favorites (user_id, listing_id, created_at) VALUES
    (charlie_id, test_listing_id, NOW());

  -- Attendre un instant pour que le trigger s'exécute
  PERFORM pg_sleep(0.1);

  -- Vérifier qu'une notification a été créée pour Alice
  SELECT COUNT(*) INTO notif_count_after FROM public.notifications 
  WHERE user_id = alice_id 
  AND type = 'favorite';
  
  RAISE NOTICE 'Notifications favoris APRÈS: %', notif_count_after;

  -- Récupérer la notification créée
  SELECT * INTO notif_record FROM public.notifications 
  WHERE user_id = alice_id 
  AND type = 'favorite'
  ORDER BY created_at DESC
  LIMIT 1;

  IF notif_count_after > 0 THEN
    RAISE NOTICE '✅ TEST RÉUSSI: Notification créée !';
    RAISE NOTICE '   - Type: %', notif_record.type;
    RAISE NOTICE '   - Titre: %', notif_record.title;
    RAISE NOTICE '   - Contenu: %', LEFT(notif_record.content, 50) || '...';
    RAISE NOTICE '   - Lien: %', notif_record.link;
  ELSE
    RAISE EXCEPTION '❌ TEST ÉCHOUÉ: Aucune notification créée pour le favori !';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════
-- TEST 3 : Trigger de REVIEWS
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  notif_count_before INTEGER;
  notif_count_after INTEGER;
  notif_record RECORD;
  alice_id UUID;
  bob_id UUID;
  test_listing_id UUID;
BEGIN
  -- Récupérer les IDs depuis la table temporaire
  SELECT t.alice_id, t.bob_id, t.test_listing_id 
  INTO alice_id, bob_id, test_listing_id 
  FROM test_users t;

  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════╗';
  RAISE NOTICE '║ TEST 3 : Notification de Review                  ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════╝';

  -- Compter les notifications avant
  SELECT COUNT(*) INTO notif_count_before FROM public.notifications 
  WHERE user_id = alice_id 
  AND type = 'review';
  RAISE NOTICE 'Notifications review AVANT: %', notif_count_before;

  -- Bob laisse un avis sur Alice
  INSERT INTO public.reviews (reviewer_id, seller_id, listing_id, rating, comment, created_at) VALUES
    (bob_id, alice_id, test_listing_id, 5, 'TEST_REVIEW: Excellente vendeuse !', NOW());

  -- Attendre un instant pour que le trigger s'exécute
  PERFORM pg_sleep(0.1);

  -- Vérifier qu'une notification a été créée pour Alice
  SELECT COUNT(*) INTO notif_count_after FROM public.notifications 
  WHERE user_id = alice_id 
  AND type = 'review';
  
  RAISE NOTICE 'Notifications review APRÈS: %', notif_count_after;

  -- Récupérer la notification créée
  SELECT * INTO notif_record FROM public.notifications 
  WHERE user_id = alice_id 
  AND type = 'review'
  ORDER BY created_at DESC
  LIMIT 1;

  IF notif_count_after > 0 THEN
    RAISE NOTICE '✅ TEST RÉUSSI: Notification créée !';
    RAISE NOTICE '   - Type: %', notif_record.type;
    RAISE NOTICE '   - Titre: %', notif_record.title;
    RAISE NOTICE '   - Contenu: %', notif_record.content;
    RAISE NOTICE '   - Lien: %', notif_record.link;
  ELSE
    RAISE EXCEPTION '❌ TEST ÉCHOUÉ: Aucune notification créée pour le review !';
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════
-- TEST 4 : Vérifier que les contraintes fonctionnent
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  alice_id UUID;
BEGIN
  -- Récupérer l'ID d'Alice depuis la table temporaire
  SELECT t.alice_id INTO alice_id FROM test_users t;

  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════╗';
  RAISE NOTICE '║ TEST 4 : Validation des contraintes              ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════╝';

  -- Test 4.1: Vérifier que le type 'favorite' est autorisé
  BEGIN
    INSERT INTO public.notifications (user_id, type, title, content, link, read) VALUES
      (alice_id, 'favorite', 'Test', 'Test', '/test', false);
    RAISE NOTICE '✅ Type "favorite" accepté';
  EXCEPTION WHEN check_violation THEN
    RAISE EXCEPTION '❌ Type "favorite" rejeté par la contrainte !';
  END;

  -- Test 4.2: Vérifier que le type 'review' est autorisé
  BEGIN
    INSERT INTO public.notifications (user_id, type, title, content, link, read) VALUES
      (alice_id, 'review', 'Test', 'Test', '/test', false);
    RAISE NOTICE '✅ Type "review" accepté';
  EXCEPTION WHEN check_violation THEN
    RAISE EXCEPTION '❌ Type "review" rejeté par la contrainte !';
  END;

  -- Test 4.3: Vérifier qu'un type invalide est rejeté
  BEGIN
    INSERT INTO public.notifications (user_id, type, title, content, link, read) VALUES
      (alice_id, 'invalid_type', 'Test', 'Test', '/test', false);
    RAISE EXCEPTION '❌ Type invalide accepté (ne devrait pas arriver) !';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '✅ Type invalide correctement rejeté';
  END;
END $$;


-- ═══════════════════════════════════════════════════════════
-- RÉSUMÉ FINAL
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  total_notifs INTEGER;
  alice_id UUID;
BEGIN
  -- Récupérer l'ID d'Alice
  SELECT t.alice_id INTO alice_id FROM test_users t;

  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════╗';
  RAISE NOTICE '║ RÉSUMÉ DES TESTS                                  ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════╝';

  SELECT COUNT(*) INTO total_notifs FROM public.notifications 
  WHERE user_id = alice_id
  AND (content LIKE '%TEST_%' OR link LIKE '%TEST_%');

  RAISE NOTICE 'Total notifications de test créées: %', total_notifs;
  RAISE NOTICE '';
  RAISE NOTICE '✅ TOUS LES TESTS RÉUSSIS !';
  RAISE NOTICE '';
  RAISE NOTICE 'Le système de notifications fonctionne correctement :';
  RAISE NOTICE '  • Messages → Notifications créées ✓';
  RAISE NOTICE '  • Favoris → Notifications créées ✓';
  RAISE NOTICE '  • Reviews → Notifications créées ✓';
  RAISE NOTICE '  • Contraintes de type → Fonctionnelles ✓';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Vous pouvez maintenant vérifier les notifications dans votre interface !';
END $$;


-- ═══════════════════════════════════════════════════════════
-- CLEANUP: Nettoyer les données de test
-- ═══════════════════════════════════════════════════════════

-- ⚠️ DÉCOMMENTEZ la section ci-dessous pour nettoyer automatiquement
-- Si vous voulez garder les données de test, laissez commenté

/*
DELETE FROM public.notifications WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email LIKE 'test_%@notifications.test'
);
DELETE FROM public.reviews WHERE seller_id IN (
  SELECT id FROM public.profiles WHERE email LIKE 'test_%@notifications.test'
);
DELETE FROM public.messages WHERE conversation_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
DELETE FROM public.conversations WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
DELETE FROM public.favorites WHERE listing_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DELETE FROM public.listings WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DELETE FROM public.profiles WHERE email LIKE 'test_%@notifications.test';

RAISE NOTICE '';
RAISE NOTICE '🧹 Données de test nettoyées';
*/

COMMIT;

-- ═══════════════════════════════════════════════════════════
-- FIN DU SCRIPT DE TEST
-- ═══════════════════════════════════════════════════════════

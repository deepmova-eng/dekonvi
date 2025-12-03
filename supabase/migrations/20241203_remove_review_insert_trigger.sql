-- ═══════════════════════════════════════════════════════════
-- NETTOYAGE : Supprimer l'ancien trigger de notification sur INSERT
-- Date: 2024-12-03
-- Objectif: Ne notifier le vendeur QUE lors de la validation admin (UPDATE)
-- ═══════════════════════════════════════════════════════════

-- CONTEXTE :
-- Nous avions créé un trigger qui notifiait à la création (INSERT) de l'avis.
-- Mais notre workflow est : Création en 'pending' → Validation admin → Notification
-- Donc on garde uniquement le trigger sur UPDATE (validation).

-- ÉTAPE 1 : Supprimer le trigger sur INSERT
DROP TRIGGER IF EXISTS on_new_review ON public.reviews;
DROP TRIGGER IF EXISTS on_review_created ON public.reviews;

-- ÉTAPE 2 : Supprimer la fonction associée (elle ne sert plus)
DROP FUNCTION IF EXISTS public.handle_new_review();

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Lister tous les triggers restants sur la table reviews
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'reviews'
ORDER BY trigger_name;

-- Vous devriez voir uniquement :
-- - on_review_approved (AFTER UPDATE) ✅
-- - reviews_updated_at (BEFORE UPDATE) ✅
-- 
-- Si on_new_review apparaît encore, c'est un problème ❌

-- ═══════════════════════════════════════════════════════════
-- RÉSULTAT ATTENDU
-- ═══════════════════════════════════════════════════════════

-- Désormais, le vendeur recevra une notification UNIQUEMENT quand :
-- 1. Un admin clique sur "Valider" dans le dashboard
-- 2. Le statut de l'avis passe de 'pending' à 'approved'
-- 3. Le trigger on_review_approved se déclenche
-- 
-- Il ne recevra PLUS de notification lors de la simple création de l'avis.

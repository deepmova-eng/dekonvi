-- ═══════════════════════════════════════════════════════════
-- Migration: Fix Reports Status Constraint
-- Date: 2024-12-08
-- Objectif: Autoriser status = 'dismissed' (actuellement bloqué)
-- BUG: "new row violates check constraint 'reports_status_check'"
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : DROP l'ancienne contrainte (si elle existe)
ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_status_check;

-- ÉTAPE 2 : Créer nouvelle contrainte avec 'dismissed' inclus
ALTER TABLE public.reports
ADD CONSTRAINT reports_status_check
CHECK (status IN ('pending', 'resolved', 'dismissed'));

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Voir la contrainte créée
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.reports'::regclass
AND conname = 'reports_status_check';

-- Résultat attendu: CHECK ((status = ANY (ARRAY['pending', 'resolved', 'dismissed'])))

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Status 'dismissed' maintenant autorisé !
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- Migration: Upgrade Reports System for Trust & Safety
-- Date: 2024-12-08
-- Objectif: Permettre signalement listings ET users avec motifs stricts
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Ajouter target_type pour signaler users ET listings
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'listing' 
CHECK (target_type IN ('listing', 'user'));

-- ÉTAPE 2 : Ajouter reported_user_id pour signalements de profils
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ÉTAPE 3 : Rendre listing_id nullable (car peut être user report)
ALTER TABLE public.reports 
ALTER COLUMN listing_id DROP NOT NULL;

-- ÉTAPE 4 : Rendre reason enum strict
ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_reason_check;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_reason_check 
CHECK (reason IN ('scam', 'spam', 'inappropriate', 'other'));

-- ÉTAPE 5 : Ajouter contrainte : listing_id OU reported_user_id doit être rempli
ALTER TABLE public.reports
ADD CONSTRAINT reports_target_check
CHECK (
  (target_type = 'listing' AND listing_id IS NOT NULL AND reported_user_id IS NULL) OR
  (target_type = 'user' AND reported_user_id IS NOT NULL AND listing_id IS NULL)
);

-- ÉTAPE 6 : Index pour performance
CREATE INDEX IF NOT EXISTS idx_reports_target_type 
ON public.reports(target_type);

CREATE INDEX IF NOT EXISTS idx_reports_status_pending 
ON public.reports(status) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_reports_reported_user 
ON public.reports(reported_user_id) 
WHERE reported_user_id IS NOT NULL;

-- ÉTAPE 7 : Commentaires pour documentation
COMMENT ON COLUMN public.reports.target_type IS 
'Type de cible signalée : listing (annonce) ou user (utilisateur)';

COMMENT ON COLUMN public.reports.reported_user_id IS 
'ID de l''utilisateur signalé (si target_type = user)';

COMMENT ON COLUMN public.reports.reason IS 
'Motif : scam (arnaque), spam, inappropriate (inapproprié), other (autre)';

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Voir la structure mise à jour
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'reports'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Système de signalements prêt pour Trust & Safety !
-- ═══════════════════════════════════════════════════════════

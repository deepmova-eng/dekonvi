-- ═══════════════════════════════════════════════════════════
-- Migration: Ajouter colonne status pour bannir les utilisateurs
-- Date: 2024-12-08
-- Objectif: Permettre le bannissement des utilisateurs via status
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Ajouter colonne status à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned'));

-- ÉTAPE 2 : Mettre à jour tous les utilisateurs existants à 'active'
UPDATE public.profiles 
SET status = 'active' 
WHERE status IS NULL;

-- ÉTAPE 3 : Rendre la colonne non nullable après mise à jour
ALTER TABLE public.profiles 
ALTER COLUMN status SET NOT NULL;

-- ÉTAPE 4 : Index pour performance (queries sur utilisateurs bannis)
CREATE INDEX IF NOT EXISTS idx_profiles_status 
ON public.profiles(status)
WHERE status = 'banned';

-- ÉTAPE 5 : Commentaire pour documentation
COMMENT ON COLUMN public.profiles.status IS 
'Statut du compte utilisateur : active (actif) ou banned (banni). Les utilisateurs bannis ne peuvent pas se connecter.';

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Voir la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'status';

-- Résultat attendu :
-- status | text | NO | 'active'::text

-- ═══════════════════════════════════════════════════════════
-- IMPORTANT : RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════

-- Les utilisateurs bannis ne doivent PAS pouvoir se connecter
-- Ceci devra être géré dans l'Edge Function admin-actions

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Fonctionnalité ban/unban activée !
-- ═══════════════════════════════════════════════════════════

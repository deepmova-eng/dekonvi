-- ═══════════════════════════════════════════════════════════
-- Migration: Add RLS Policies for Reports (Trust & Safety)
-- Date: 2024-12-08
-- Objectif: Autoriser admins à UPDATE/DELETE reports + users à INSERT
-- BUG FIX: Dismiss/Sanction ne persistaient pas (Ghost Fix)
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Enable RLS sur la table reports (si pas déjà fait)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 2 : DROP des anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;

-- ÉTAPE 3 : Policy pour INSERT (Users peuvent créer des signalements)
CREATE POLICY "Users can create reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- ÉTAPE 4 : Policy pour SELECT (Admins voient tous les reports)
CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ÉTAPE 5 : Policy pour UPDATE (Admins peuvent modifier status)
-- 🔥 C'EST LE FIX PRINCIPAL - Manquait dans la migration précédente
CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ÉTAPE 6 : Policy pour DELETE (Admins peuvent supprimer si besoin)
CREATE POLICY "Admins can delete reports"
ON public.reports
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Voir toutes les policies créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reports';

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Les admins peuvent maintenant UPDATE/DELETE les reports !
-- ═══════════════════════════════════════════════════════════

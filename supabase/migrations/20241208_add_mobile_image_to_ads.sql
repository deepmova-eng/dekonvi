-- ═══════════════════════════════════════════════════════════
-- Migration: Ajout support Art Direction pour Hero Slider
-- Date: 2024-12-08
-- Objectif: Permettre des images séparées Desktop/Mobile
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Ajouter colonne pour image mobile
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS image_mobile_url TEXT;

-- ÉTAPE 2 : Index pour performance
CREATE INDEX IF NOT EXISTS idx_advertisements_mobile_url 
ON public.advertisements(image_mobile_url)
WHERE image_mobile_url IS NOT NULL;

-- ÉTAPE 3 : Commentaire pour documentation
COMMENT ON COLUMN public.advertisements.image_mobile_url IS 
'Image optimisée pour affichage mobile (800x1000px ou 800x800px portrait/carré) - Optionnel. Si NULL, image_url (desktop) est utilisée en fallback.';

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
AND table_name = 'advertisements'
ORDER BY ordinal_position;

-- Résultat attendu :
-- image_url (TEXT, NO) - Desktop
-- image_mobile_url (TEXT, YES) - Mobile (NOUVEAU)

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Art Direction activée ! Desktop (1920x630) + Mobile (800x1000)
-- ═══════════════════════════════════════════════════════════

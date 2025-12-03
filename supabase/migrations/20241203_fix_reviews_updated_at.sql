-- ═══════════════════════════════════════════════════════════
-- FIX URGENT : Ajouter updated_at à la table reviews
-- Date: 2024-12-03
-- Objectif: Corriger l'erreur "record "new" has no field "updated_at""
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Ajouter la colonne updated_at si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.reviews 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    
    RAISE NOTICE 'Colonne updated_at ajoutée à la table reviews';
  ELSE
    RAISE NOTICE 'La colonne updated_at existe déjà';
  END IF;
END $$;

-- ÉTAPE 2: Créer ou remplacer la fonction de mise à jour
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 3 : Recréer le trigger
DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reviews_updated_at();

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Vérifier que la colonne existe
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reviews' 
  AND column_name = 'updated_at';

-- Vérifier que le trigger est actif
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'reviews'
  AND trigger_name = 'reviews_updated_at';

-- Si vous voyez 1 ligne dans chaque requête, c'est bon ! ✅

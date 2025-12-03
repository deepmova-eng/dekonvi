-- ═══════════════════════════════════════════════════════════
-- FIX : Ajouter colonnes manquantes à premium_requests
-- Date: 2024-12-03
-- Objectif: Résoudre erreur 400 PGRST204 (colonnes duration et price manquantes)
-- ═══════════════════════════════════════════════════════════

-- PROBLÈME :
-- Le frontend envoie { duration: 30, price: 5000 } mais la table
-- premium_requests ne possède pas ces colonnes.

-- SOLUTION :
-- Ajouter les colonnes duration (jours) et price (montant FCFA)

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 1 : Ajouter la colonne duration
-- ═══════════════════════════════════════════════════════════

-- Vérifier si la colonne existe déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'premium_requests' 
    AND column_name = 'duration'
  ) THEN
    ALTER TABLE public.premium_requests 
    ADD COLUMN duration INTEGER DEFAULT 30;
    
    RAISE NOTICE 'Colonne duration ajoutée avec succès';
  ELSE
    RAISE NOTICE 'Colonne duration existe déjà';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 2 : Ajouter la colonne price
-- ═══════════════════════════════════════════════════════════

-- Vérifier si la colonne existe déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'premium_requests' 
    AND column_name = 'price'
  ) THEN
    ALTER TABLE public.premium_requests 
    ADD COLUMN price INTEGER DEFAULT 5000;
    
    RAISE NOTICE 'Colonne price ajoutée avec succès';
  ELSE
    RAISE NOTICE 'Colonne price existe déjà';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Voir toutes les colonnes de premium_requests
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'premium_requests'
ORDER BY ordinal_position;

-- Résultat attendu : colonnes incluant duration et price

-- ═══════════════════════════════════════════════════════════
-- RAPPEL : RELOAD SCHEMA CACHE
-- ═══════════════════════════════════════════════════════════

-- Après exécution, allez dans :
-- Supabase Dashboard > Settings > API > Reload schema cache
-- Ou attendez ~1 minute pour le refresh automatique

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Le boost peut maintenant être envoyé avec succès ! 💎
-- ═══════════════════════════════════════════════════════════

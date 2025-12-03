-- ═══════════════════════════════════════════════════════════
-- MIGRATION: Création de la table reviews
-- Date: 2024-12-03
-- Objectif: Créer la table reviews pour le système d'avis vendeurs
-- ═══════════════════════════════════════════════════════════

-- Créer la table reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  proof_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Contrainte : un utilisateur ne peut laisser qu'un seul avis par vendeur
  UNIQUE(seller_id, reviewer_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS reviews_seller_id_idx ON public.reviews(seller_id);
CREATE INDEX IF NOT EXISTS reviews_reviewer_id_idx ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON public.reviews(status);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les avis approuvés
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
TO public
USING (status = 'approved');

-- Policy: Les utilisateurs peuvent voir leurs propres avis (même en attente)
CREATE POLICY "Users can view their own reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (reviewer_id = auth.uid() OR seller_id = auth.uid());

-- Policy: Les utilisateurs peuvent créer des avis
CREATE POLICY "Users can create reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (reviewer_id = auth.uid() AND reviewer_id != seller_id);

-- Policy: Les admins peuvent tout voir et modifier
CREATE POLICY "Admins can do everything"
ON public.reviews
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Fonction de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reviews_updated_at();

-- ═══════════════════════════════════════════════════════════
-- Vérification
-- ═══════════════════════════════════════════════════════════

-- Afficher la structure de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'reviews'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════
-- FIX URGENT : Politiques RLS pour le bucket review-proofs
-- Date: 2024-12-03
-- Objectif: Autoriser les utilisateurs à uploader leurs preuves d'achat
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Supprimer les anciennes politiques (au cas où)
DROP POLICY IF EXISTS "Users can upload review proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view review proofs" ON storage.objects;
DROP POLICY IF EXISTS "Public can view review proofs" ON storage.objects;

-- ÉTAPE 2 : Créer la politique d'UPLOAD (INSERT)
CREATE POLICY "Users can upload review proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-proofs' 
  AND (storage.foldername(name))[1] = 'reviews'
  AND auth.uid()::text IS NOT NULL
);

-- ÉTAPE 3 : Créer la politique de LECTURE (SELECT) pour les admins et propriétaires
-- Drop d'abord si elle existe
DROP POLICY IF EXISTS "Users can view their own review proofs" ON storage.objects;

CREATE POLICY "Users can view their own review proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'review-proofs'
  AND (
    -- L'utilisateur peut voir ses propres uploads
    owner = auth.uid()
    -- Ou c'est un admin
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- ÉTAPE 4 : Permettre la vue publique pour les preuves validées (optionnel)
-- Décommentez si vous voulez que les preuves soient publiquement visibles
/*
CREATE POLICY "Public can view approved review proofs"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'review-proofs'
);
*/

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION : Lister toutes les politiques du bucket
-- ═══════════════════════════════════════════════════════════

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (
  policyname LIKE '%review%'
  OR qual LIKE '%review-proofs%'
  OR with_check LIKE '%review-proofs%'
)
ORDER BY policyname;

-- Si vous voyez les 2 policies ci-dessus, c'est bon ! ✅

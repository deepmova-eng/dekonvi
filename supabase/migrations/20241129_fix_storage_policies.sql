-- ═══════════════════════════════════════════════════════════
-- FIX STORAGE POLICIES - message-images bucket
-- Date: 29 novembre 2025
-- Issue: Policies DELETE et INSERT trop permissives
-- ═══════════════════════════════════════════════════════════

-- 1. SUPPRIMER les policies dangereuses actuelles
DROP POLICY IF EXISTS "Users can delete their own message images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload message images" ON storage.objects;

-- 2. CRÉER policy INSERT sécurisée
-- User peut uploader SEULEMENT dans son propre folder
-- Format attendu: userId/filename.ext
CREATE POLICY "Users can upload only to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'gif'))
);

-- 3. CRÉER policy DELETE sécurisée
-- User peut supprimer SEULEMENT ses propres images
CREATE POLICY "Users can delete only their own folder images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. VÉRIFICATION
-- Lister les policies pour vérifier
SELECT 
  policyname, 
  cmd,
  with_check,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%message%'
ORDER BY policyname;

-- Résultat attendu : 3 policies
-- 1. Public read access for message images (SELECT) - inchangée
-- 2. Users can upload only to their own folder (INSERT) - nouvelle
-- 3. Users can delete only their own folder images (DELETE) - nouvelle

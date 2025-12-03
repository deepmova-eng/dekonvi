-- ═══════════════════════════════════════════════════════════
-- FIX URGENT : Restaurer les politiques RLS sur favorites
-- ═══════════════════════════════════════════════════════════

-- 1. Supprimer les anciennes politiques (au cas où)
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;

-- 2. Activer RLS (au cas où ce n'est pas déjà fait)
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 3. Créer une politique unifiée pour gérer tous les cas (SELECT, INSERT, DELETE)
CREATE POLICY "Users can manage their own favorites"
ON public.favorites
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Vérification : Lister toutes les politiques sur favorites
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
WHERE tablename = 'favorites'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════
-- Si tout est OK, vous devriez voir la policy ci-dessus listée
-- ═══════════════════════════════════════════════════════════

-- 1. Supprimer TOUTES les policies existantes pour éviter les conflits
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON favorites;
DROP POLICY IF EXISTS "Enable read access for own favorites" ON favorites;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON favorites;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON favorites;

-- 2. S'assurer que RLS est activé
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 3. Créer les policies une par une

-- Policy SELECT (voir ses favoris)
CREATE POLICY "Users can view own favorites"
ON favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy INSERT (ajouter aux favoris)
CREATE POLICY "Users can add favorites"
ON favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy DELETE (retirer des favoris)
CREATE POLICY "Users can remove favorites"
ON favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Vérification (optionnel, pour info)
-- SELECT * FROM pg_policies WHERE tablename = 'favorites';

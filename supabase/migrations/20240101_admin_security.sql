-- Ajouter la colonne role dans profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('user', 'admin'));

-- Créer un index pour performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Mettre l'admin actuel en role admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@dekonvi.com'
);

-- RLS Policy : Seuls les admins peuvent voir toutes les annonces
DROP POLICY IF EXISTS "Admin can view all listings" ON listings;
CREATE POLICY "Admin can view all listings"
ON listings FOR SELECT
USING (
  status = 'active' 
  OR 
  seller_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS Policy : Seuls les admins peuvent approuver/rejeter
DROP POLICY IF EXISTS "Admin can update listing status" ON listings;
CREATE POLICY "Admin can update listing status"
ON listings FOR UPDATE
USING (
  seller_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  seller_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- RLS Policy : Seuls les admins peuvent voir tous les utilisateurs
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles"
ON profiles FOR SELECT
USING (
  id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

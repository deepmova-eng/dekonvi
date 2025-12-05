-- ============================================
-- FIX: Realtime Refresh Between Tabs
-- ============================================
-- Permet aux utilisateurs publics/anonymes de voir TOUS les listings
-- (pas seulement actifs) pour que Realtime puisse accéder aux oldStatus

-- IMPORTANT: Cette policy permet de LIRE toutes les annonces,
-- mais seules les annonces ACTIVES seront affichées par les filtres côté client

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view active listings" ON listings;
DROP POLICY IF EXISTS "Anyone can view active listings" ON listings;
DROP POLICY IF EXISTS "Public can view all listings for Realtime" ON listings;

-- Create policy for public SELECT on ALL listings
-- Ceci permet à Realtime d'avoir accès à oldStatus lors des UPDATE
CREATE POLICY "Public can view all listings for Realtime"
ON listings FOR SELECT
TO authenticated, anon
USING (true);  -- ⚠️ Permet SELECT sur TOUTES les lignes (filtrage côté client)

-- Note: Le filtrage status='active' sera fait côté client dans les queries
-- Ceci permet à Supabase Realtime d'accéder aux anciennes valeurs (old)

-- Verification: List all SELECT policies on listings
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'listings' AND cmd = 'SELECT'
ORDER BY policyname;

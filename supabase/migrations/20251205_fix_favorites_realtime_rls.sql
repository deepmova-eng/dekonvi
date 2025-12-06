-- ============================================
-- FIX: Favorites Realtime Subscription CLOSED Issue
-- ============================================
-- Problem: Realtime subscription closes because RLS policies
-- block access to deleted records (old values in DELETE events)
--
-- Solution: Allow authenticated users to SELECT their own favorites
-- This enables Realtime to access both new AND old values

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;

-- Recreate SELECT policy (essential for Realtime to work)
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Recreate INSERT policy
CREATE POLICY "Users can add favorites"
ON public.favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Recreate DELETE policy
CREATE POLICY "Users can remove their own favorites"
ON public.favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify policies
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

-- ============================================
-- Expected Result: 3 policies should be listed
-- 1. Users can view their own favorites (SELECT)
-- 2. Users can add favorites (INSERT)
-- 3. Users can remove their own favorites (DELETE)
-- ============================================

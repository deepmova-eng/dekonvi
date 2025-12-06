-- ============================================
-- FIX: Favorites Realtime RLS - Version 2
-- ============================================
-- This version drops the correct existing policy name

-- First, let's see what we have
SELECT policyname FROM pg_policies WHERE tablename = 'favorites';

-- Drop the existing "FOR ALL" policy (from previous migration)
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;

-- Also drop these in case they exist from previous attempts
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.favorites;

-- Create separate policies for each operation
-- This is required for Realtime to access old values during DELETE

-- SELECT policy (essential for Realtime)
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can add favorites"
ON public.favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can remove their own favorites"
ON public.favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify the new policies
SELECT 
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text
FROM pg_policies 
WHERE tablename = 'favorites'
ORDER BY policyname;

-- Expected Result: 3 policies
-- 1. Users can add favorites (INSERT)
-- 2. Users can remove their own favorites (DELETE)
-- 3. Users can view their own favorites (SELECT)

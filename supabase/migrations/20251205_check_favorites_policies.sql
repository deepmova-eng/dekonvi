-- ============================================
-- STEP 1: Check existing RLS policies on favorites table
-- ============================================
-- Run this first to see what policies currently exist
SELECT 
  policyname,
  cmd AS operation,
  qual AS using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'favorites'
ORDER BY policyname;

-- Expected output: list of policy names like:
-- - "Users can manage their own favorites"
-- OR
-- - "Users can add favorites"
-- - "Users can view their own favorites"
-- - "Users can remove their own favorites"

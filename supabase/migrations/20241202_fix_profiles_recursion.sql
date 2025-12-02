-- Migration: Fix infinite recursion in profiles RLS policy
-- Created: 2024-12-02
-- Purpose: Fix "infinite recursion detected in policy for relation profiles" error
--          by allowing public read access to profiles (standard for marketplace)

-- 1. Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can see profiles involved in their conversations" ON "public"."profiles";
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can view own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."profiles";

-- 2. Create simple, non-recursive policy for profile read access
-- This is standard for marketplace apps where users need to see seller/buyer names
CREATE POLICY "Public profiles are viewable by everyone"
ON "public"."profiles"
FOR SELECT
USING ( true );

-- Add comment for documentation
COMMENT ON POLICY "Public profiles are viewable by everyone" ON "public"."profiles" 
IS 'Allows public read access to all profiles. Standard for marketplace where users need to see seller/buyer information. No recursion risk.';

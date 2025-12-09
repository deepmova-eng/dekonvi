-- ============================================
-- 🔒 SECURITY FIX: Harmonize Admin Checks
-- Date: 2025-12-09
-- Issue: Inconsistent admin verification (is_admin() vs profiles.role)
-- Solution: Centralize all admin checks to use is_admin() function
-- ============================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1: Fix reports table policies
-- Replace profiles.role checks with is_admin()
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;

-- SELECT: Admins can view all reports
CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (public.is_admin());

-- UPDATE: Admins can update reports
CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: Admins can delete reports
CREATE POLICY "Admins can delete reports"
ON public.reports FOR DELETE
TO authenticated
USING (public.is_admin());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2: Fix tickets table policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;

-- SELECT: Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (public.is_admin());

-- UPDATE: Admins can update tickets
CREATE POLICY "Admins can update tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 3: Fix ticket_messages policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP POLICY IF EXISTS "Authenticated can send messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Can view ticket messages" ON public.ticket_messages;

-- INSERT: User propriétaire OU admin
CREATE POLICY "Authenticated can send messages"
ON public.ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (
    -- User propriétaire du ticket
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_id
      AND tickets.user_id = auth.uid()
    )
    OR
    -- Ou admin (centralisé)
    public.is_admin()
  )
);

-- SELECT: User propriétaire OU admin
CREATE POLICY "Can view ticket messages"
ON public.ticket_messages FOR SELECT
TO authenticated
USING (
  -- User propriétaire du ticket
  EXISTS (
    SELECT 1 FROM public.tickets
    WHERE tickets.id = ticket_id
    AND tickets.user_id = auth.uid()
  )
  OR
  -- Ou admin (centralisé)
  public.is_admin()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 4: Fix reviews policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP POLICY IF EXISTS "Admins can do everything" ON public.reviews;

-- Admins can do everything (centralisé)
CREATE POLICY "Admins can do everything"
ON public.reviews FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VERIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier que toutes les policies utilisent is_admin()
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('reports', 'tickets', 'ticket_messages', 'reviews', 'premium_requests', 'listings')
AND (qual LIKE '%is_admin%' OR with_check LIKE '%is_admin%' OR qual LIKE '%profiles.role%' OR with_check LIKE '%profiles.role%')
ORDER BY tablename, policyname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SECURITY FIX COMPLETE
-- All admin checks now centralized via is_admin()
-- Benefits:
-- - Single source of truth
-- - No RLS recursion issues
-- - Easier to maintain/modify admin logic
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

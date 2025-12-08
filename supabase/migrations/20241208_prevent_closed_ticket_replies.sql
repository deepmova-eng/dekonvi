-- Professional Ticket Closure Workflow
-- Prevent users from replying to closed tickets (security + UX)

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Block INSERT on ticket_messages if ticket is closed
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Cannot reply to closed tickets" ON public.ticket_messages;

CREATE POLICY "Cannot reply to closed tickets"
ON public.ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id 
    AND status = 'closed'
  )
);

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Add helpful comment
-- ═══════════════════════════════════════════════════════════

COMMENT ON POLICY "Cannot reply to closed tickets" ON public.ticket_messages IS 
'Prevents users and admins from adding messages to closed tickets. Closed = archived/final state.';

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════

-- List all policies on ticket_messages
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
WHERE tablename = 'ticket_messages'
AND schemaname = 'public'
ORDER BY policyname;

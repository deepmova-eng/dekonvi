-- Auto-reopen resolved tickets when user sends a message
-- This implements the "grace period" workflow at database level
-- to avoid RLS permission issues

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Create trigger function
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auto_reopen_resolved_tickets()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if message is being added to a resolved ticket
    -- AND the sender is a regular user (not admin)
    IF EXISTS (
        SELECT 1 
        FROM public.tickets t
        JOIN public.profiles p ON p.id = NEW.sender_id
        WHERE t.id = NEW.ticket_id 
        AND t.status = 'resolved'
        AND p.role = 'user'
    ) THEN
        -- Auto-reopen: change status from 'resolved' to 'in_progress'
        UPDATE public.tickets
        SET status = 'in_progress'
        WHERE id = NEW.ticket_id;
        
        RAISE NOTICE 'Ticket % auto-reopened by user reply', NEW.ticket_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Create trigger
-- ═══════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS auto_reopen_on_user_reply ON public.ticket_messages;

CREATE TRIGGER auto_reopen_on_user_reply
    BEFORE INSERT ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_reopen_resolved_tickets();

-- ═══════════════════════════════════════════════════════════
-- STEP 3: Add helpful comments
-- ═══════════════════════════════════════════════════════════

COMMENT ON FUNCTION auto_reopen_resolved_tickets() IS 
'Automatically reopens (resolved → in_progress) tickets when a regular user sends a message. This implements the grace period workflow.';

COMMENT ON TRIGGER auto_reopen_on_user_reply ON public.ticket_messages IS 
'Triggers before INSERT to auto-reopen resolved tickets when users reply.';

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════

-- Test: Create a resolved ticket and add a user message
-- It should auto-reopen to 'in_progress'

-- List triggers
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'public.ticket_messages'::regclass
AND tgname = 'auto_reopen_on_user_reply';

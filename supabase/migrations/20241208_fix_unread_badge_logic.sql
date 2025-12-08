-- Fix: Track last message sender to avoid false unread badges
-- Admin should only see badge if USER sent last message, and vice versa

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Add last_message_sender_role column
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.tickets
ADD COLUMN last_message_sender_role TEXT;

COMMENT ON COLUMN public.tickets.last_message_sender_role IS 'Role of the sender of the last message (admin/user) - used for unread badge logic';

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Populate existing tickets with last message sender
-- ═══════════════════════════════════════════════════════════

UPDATE public.tickets t
SET last_message_sender_role = (
    SELECT p.role
    FROM public.ticket_messages tm
    JOIN public.profiles p ON p.id = tm.sender_id
    WHERE tm.ticket_id = t.id
    ORDER BY tm.created_at DESC
    LIMIT 1
);

-- ═══════════════════════════════════════════════════════════
-- STEP 3: Create trigger to auto-update on new message
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_ticket_last_sender()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the ticket's last_message_sender_role
    UPDATE public.tickets
    SET 
        last_message_sender_role = (
            SELECT role 
            FROM public.profiles 
            WHERE id = NEW.sender_id
        ),
        updated_at = NOW()
    WHERE id = NEW.ticket_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_ticket_last_sender_trigger ON public.ticket_messages;

-- Create trigger
CREATE TRIGGER update_ticket_last_sender_trigger
    AFTER INSERT ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_last_sender();

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════

SELECT 
    id,
    subject,
    last_message_sender_role,
    updated_at
FROM public.tickets
ORDER BY updated_at DESC
LIMIT 5;

-- Add "last read" tracking for unread badges
-- This enables "unread message" badges on tickets for both admin and users

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Add last_read columns to tickets table
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.tickets
ADD COLUMN admin_last_read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN user_last_read_at TIMESTAMP WITH TIME ZONE;

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Set initial values (mark all existing tickets as read)
-- ═══════════════════════════════════════════════════════════

-- Mark existing tickets as "fully read" to avoid false positives
UPDATE public.tickets
SET 
    admin_last_read_at = NOW(),
    user_last_read_at = NOW()
WHERE admin_last_read_at IS NULL OR user_last_read_at IS NULL;

-- ═══════════════════════════════════════════════════════════
-- STEP 3: Add helpful comments
-- ═══════════════════════════════════════════════════════════

COMMENT ON COLUMN public.tickets.admin_last_read_at IS 'Last time admin opened this ticket conversation';
COMMENT ON COLUMN public.tickets.user_last_read_at IS 'Last time user opened this ticket conversation';

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════

-- Verify columns were added
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tickets' 
  AND table_schema = 'public'
  AND column_name IN ('admin_last_read_at', 'user_last_read_at')
ORDER BY column_name;

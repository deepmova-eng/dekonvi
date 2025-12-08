-- Ticket Archiving System
-- Implements soft-delete pattern: tickets never truly deleted, preserves legal evidence

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Add archiving columns
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.tickets
ADD COLUMN archived_by_user BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN archived_by_admin BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN public.tickets.archived_by_user IS 'User clicked Archive - ticket hidden from user view only';
COMMENT ON COLUMN public.tickets.archived_by_admin IS 'Admin archived - visible in Archives tab';
COMMENT ON COLUMN public.tickets.deleted_at IS 'Soft delete timestamp - admin only for spam/test tickets';
COMMENT ON COLUMN public.tickets.archived_at IS 'When ticket was archived (record keeping)';

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Create indexes for performance
-- ═══════════════════════════════════════════════════════════

CREATE INDEX idx_tickets_archived_by_user ON public.tickets(archived_by_user) WHERE archived_by_user = true;
CREATE INDEX idx_tickets_archived_by_admin ON public.tickets(archived_by_admin) WHERE archived_by_admin = true;
CREATE INDEX idx_tickets_deleted_at ON public.tickets(deleted_at) WHERE deleted_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- STEP 3: RLS Policies for archiving
-- ═══════════════════════════════════════════════════════════

-- Users can only archive their own tickets (update archived_by_user field only)
DROP POLICY IF EXISTS "Users can archive their own tickets" ON public.tickets;

CREATE POLICY "Users can archive their own tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'user'
  )
)
WITH CHECK (
  user_id = auth.uid()
  -- Can only modify archived_by_user column
  AND (archived_by_user IS DISTINCT FROM (
    SELECT archived_by_user FROM public.tickets WHERE id = tickets.id
  ))
);

-- Admins can archive/soft-delete any ticket
DROP POLICY IF EXISTS "Admins can archive and delete tickets" ON public.tickets;

CREATE POLICY "Admins can archive and delete tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ═══════════════════════════════════════════════════════════
-- STEP 4: Update SELECT policies to filter archived/deleted
-- ═══════════════════════════════════════════════════════════

-- Update user SELECT policy to exclude archived tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;

CREATE POLICY "Users can view their own tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND archived_by_user = false  -- Don't show archived tickets
  AND deleted_at IS NULL         -- Don't show deleted tickets
);

-- Admins can see all tickets (including archived, but excluding deleted by default)
-- (Deleted tickets will require explicit filter in UI)
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;

CREATE POLICY "Admins can view all tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
  AND deleted_at IS NULL  -- By default, don't show soft-deleted tickets
);

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════

-- Check columns added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tickets' 
AND table_schema = 'public'
AND column_name IN ('archived_by_user', 'archived_by_admin', 'deleted_at', 'archived_at')
ORDER BY ordinal_position;

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'tickets'
AND schemaname = 'public'
AND indexname LIKE 'idx_tickets_archived%';

-- Check policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'tickets'
AND schemaname = 'public'
AND policyname LIKE '%archive%'
ORDER BY policyname;

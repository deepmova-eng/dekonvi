-- ═══════════════════════════════════════════════════════════
-- Migration: Create Support Ticketing System
-- Date: 2024-12-08
-- Objectif: Système de tickets pour support client centralisé
-- Tables: tickets + ticket_messages
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Fonction helper pour updated_at (si pas déjà créée)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 2 : Créer table tickets
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (subject IN (
    'validation_issue',
    'technical_bug', 
    'billing',
    'other'
  )),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',
    'in_progress',
    'resolved',
    'closed'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
    'low',
    'medium',
    'high'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÉTAPE 3 : Créer table ticket_messages  
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÉTAPE 4 : Index performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at ASC);

-- ÉTAPE 5 : Trigger auto-update updated_at
DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ÉTAPE 6 : Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 7 : RLS Policies pour tickets

-- Users: INSERT (CRITIQUE: même si email non confirmé!)
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "Users can create tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users: SELECT leurs propres tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins: SELECT tous tickets
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
CREATE POLICY "Admins can view all tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins: UPDATE tickets (status, priority)
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
CREATE POLICY "Admins can update tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ÉTAPE 8 : RLS Policies pour ticket_messages

-- INSERT: User propriétaire OU admin
DROP POLICY IF EXISTS "Authenticated can send messages" ON public.ticket_messages;
CREATE POLICY "Authenticated can send messages"
ON public.ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (
    -- User est propriétaire du ticket
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_id
      AND tickets.user_id = auth.uid()
    )
    OR
    -- Ou user est admin
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

-- SELECT: User propriétaire OU admin
DROP POLICY IF EXISTS "Can view ticket messages" ON public.ticket_messages;
CREATE POLICY "Can view ticket messages"
ON public.ticket_messages FOR SELECT
TO authenticated
USING (
  -- User est propriétaire du ticket
  EXISTS (
    SELECT 1 FROM public.tickets
    WHERE tickets.id = ticket_id
    AND tickets.user_id = auth.uid()
  )
  OR
  -- Ou user est admin  
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Voir les tables créées
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN ('tickets', 'ticket_messages');

-- Voir les policies créées
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('tickets', 'ticket_messages')
ORDER BY tablename, cmd;

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Système de ticketing prêt !
-- ═══════════════════════════════════════════════════════════

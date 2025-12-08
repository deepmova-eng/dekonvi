-- Fix Foreign Keys pour Tickets System
-- Problème: tickets.user_id et ticket_messages.sender_id pointent vers auth.users
-- Solution: Pointer vers public.profiles pour permettre les jointures PostgREST

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 1 : Fix tickets.user_id
-- ═══════════════════════════════════════════════════════════

-- Supprimer l'ancienne contrainte vers auth.users
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;

-- Créer la nouvelle contrainte vers public.profiles
ALTER TABLE public.tickets
ADD CONSTRAINT tickets_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════════
-- ÉTAPE 2 : Fix ticket_messages.sender_id
-- ═══════════════════════════════════════════════════════════

-- Supprimer l'ancienne contrainte vers auth.users
ALTER TABLE public.ticket_messages
DROP CONSTRAINT IF EXISTS ticket_messages_sender_id_fkey;

-- Créer la nouvelle contrainte vers public.profiles
ALTER TABLE public.ticket_messages
ADD CONSTRAINT ticket_messages_sender_id_fkey 
FOREIGN KEY (sender_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Vérifier que les contraintes sont bien en place
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('tickets', 'ticket_messages')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

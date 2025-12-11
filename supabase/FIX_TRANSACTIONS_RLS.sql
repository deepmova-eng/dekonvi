-- ═══════════════════════════════════════════════════════════
-- FIX RLS: Allow users to INSERT their own transactions
-- Date: 2025-12-10
-- À exécuter dans Supabase SQL Editor Dashboard
-- ═══════════════════════════════════════════════════════════

-- Add INSERT policy for authenticated users
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- ✅ RLS FIX DEPLOYED
-- Maintenant les users peuvent créer leurs propres transactions
-- ═══════════════════════════════════════════════════════════

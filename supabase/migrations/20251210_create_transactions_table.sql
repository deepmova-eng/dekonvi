-- ═══════════════════════════════════════════════════════════
-- Migration: Create Transactions Table for PayGate Payments
-- Date: 2025-12-10
-- Objectif: Tracker les paiements Mobile Money (TMoney/Flooz)
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Créer la table transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.boost_packages(id),
    
    -- Détails paiement
    amount INTEGER NOT NULL CHECK (amount > 0),
    provider TEXT NOT NULL CHECK (provider IN ('tmoney', 'flooz')),
    phone_number TEXT NOT NULL,
    
    -- Statut et référence
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'cancelled', 'expired')) DEFAULT 'pending',
    paygate_ref TEXT UNIQUE, -- Référence PayGate (tx_reference)
    error_message TEXT,
    
    -- Timing (countdown 120 secondes)
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 minutes'),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÉTAPE 2 : Créer les index pour performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_listing_id ON public.transactions(listing_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_paygate_ref ON public.transactions(paygate_ref) WHERE paygate_ref IS NOT NULL;
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- ÉTAPE 3 : Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_transactions_updated_at();

-- ÉTAPE 4 : RLS Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users view own transactions"
    ON public.transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert/update/delete
CREATE POLICY "Service role full access"
    ON public.transactions
    FOR ALL
    TO service_role
    WITH CHECK (true);

-- ÉTAPE 5 : Commentaires
COMMENT ON TABLE public.transactions IS 'Transactions de paiement Mobile Money via PayGate Global (TMoney/Flooz)';
COMMENT ON COLUMN public.transactions.expires_at IS 'Date expiration paiement USSD (2 minutes après création pour countdown)';
COMMENT ON COLUMN public.transactions.paygate_ref IS 'Référence unique PayGate (tx_reference retourné par API)';
COMMENT ON COLUMN public.transactions.status IS 'pending: en attente USSD | success: payé | failed: échec | cancelled: annulé | expired: timeout 120s';

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Transactions table ready pour PayGate integration
-- ═══════════════════════════════════════════════════════════

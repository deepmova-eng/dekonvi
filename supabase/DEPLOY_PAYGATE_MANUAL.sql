-- ═══════════════════════════════════════════════════════════
-- PAYGATE PAYMENT SYSTEM - MANUAL DEPLOYMENT SQL
-- Date: 2025-12-10
-- À exécuter dans Supabase SQL Editor Dashboard
-- ═══════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. CREATE BOOST_PACKAGES TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.boost_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    price INTEGER NOT NULL CHECK (price > 0),
    description TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boost_packages_active 
ON public.boost_packages(active) WHERE active = true;

-- RLS
ALTER TABLE public.boost_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active packages" ON public.boost_packages;
CREATE POLICY "Public can view active packages"
    ON public.boost_packages
    FOR SELECT
    USING (active = true);

DROP POLICY IF EXISTS "Admins can modify packages" ON public.boost_packages;
CREATE POLICY "Admins can modify packages"
    ON public.boost_packages
    FOR ALL
    TO service_role
    WITH CHECK (true);

-- Seed Data (with ON CONFLICT to avoid duplicates)
INSERT INTO public.boost_packages (name, duration_days, price, description) VALUES
    ('Express', 1, 500, 'Boostez votre annonce pendant 24 heures. Parfait pour un coup de boost rapide !'),
    ('Pro', 7, 2000, 'Boostez votre annonce pendant 1 semaine. Idéal pour les vendeurs sérieux.'),
    ('Premium', 30, 6000, 'Boostez votre annonce pendant 1 mois. Maximum de visibilité pour les gros articles.')
ON CONFLICT (name) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. CREATE TRANSACTIONS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.boost_packages(id),
    amount INTEGER NOT NULL CHECK (amount > 0),
    provider TEXT NOT NULL CHECK (provider IN ('tmoney', 'flooz')),
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'cancelled', 'expired')) DEFAULT 'pending',
    paygate_ref TEXT UNIQUE,
    error_message TEXT,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 minutes'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_listing_id ON public.transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_paygate_ref ON public.transactions(paygate_ref) WHERE paygate_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_transactions_updated_at ON public.transactions;
CREATE TRIGGER trigger_update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_transactions_updated_at();

-- RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own transactions" ON public.transactions;
CREATE POLICY "Users view own transactions"
    ON public.transactions
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access" ON public.transactions;
CREATE POLICY "Service role full access"
    ON public.transactions
    FOR ALL
    TO service_role
    WITH CHECK (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. VERIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier packages
SELECT name, price || ' FCFA' as prix, duration_days || ' jours' as durée, active
FROM public.boost_packages
ORDER BY price;

-- Should return:
-- Express  | 500 FCFA  | 1 jour   | true
-- Pro      | 2000 FCFA  | 7 jours  | true
-- Premium  | 6000 FCFA  | 30 jours | true

-- ═══════════════════════════════════════════════════════════
-- ✅ PAYGATE TABLES DEPLOYED
-- Next: Deploy Edge Functions
-- ═══════════════════════════════════════════════════════════

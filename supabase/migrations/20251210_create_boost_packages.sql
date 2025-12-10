-- ═══════════════════════════════════════════════════════════
-- Migration: Create Boost Packages & Seed Data
-- Date: 2025-12-10
-- Objectif: Packages de boost avec pricing validé par le marché
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Créer la table boost_packages
CREATE TABLE IF NOT EXISTS public.boost_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Package details
    name TEXT NOT NULL UNIQUE,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    price INTEGER NOT NULL CHECK (price > 0), -- Prix en FCFA
    description TEXT NOT NULL,
    
    -- Flags
    active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÉTAPE 2 : Créer index
CREATE INDEX idx_boost_packages_active ON public.boost_packages(active) WHERE active = true;

-- ÉTAPE 3 : Seed data avec PRICING VALIDÉ ✅
INSERT INTO public.boost_packages (name, duration_days, price, description) VALUES
    (
        'Express',
        1,
        500,
        'Boostez votre annonce pendant 24 heures. Parfait pour un coup de boost rapide !'
    ),
    (
        'Pro',
        7,
        2000,
        'Boostez votre annonce pendant 1 semaine. Idéal pour les vendeurs sérieux.'
    ),
    (
        'Premium',
        30,
        6000,
        'Boostez votre annonce pendant 1 mois. Maximum de visibilité pour les gros articles.'
    );

-- ÉTAPE 4 : RLS Policies
ALTER TABLE public.boost_packages ENABLE ROW LEVEL SECURITY;

-- Everyone can view active packages (public catalog)
CREATE POLICY "Public can view active packages"
    ON public.boost_packages
    FOR SELECT
    USING (active = true);

-- Only admins can modify packages
CREATE POLICY "Admins can modify packages"
    ON public.boost_packages
    FOR ALL
    TO service_role
    WITH CHECK (true);

-- ÉTAPE 5 : Commentaires
COMMENT ON TABLE public.boost_packages IS 'Packages de boost d''annonces avec pricing marché togolais (FCFA)';
COMMENT ON COLUMN public.boost_packages.price IS 'Prix en FCFA - 500F (Express) / 2000F (Pro) / 6000F (Premium)';
COMMENT ON COLUMN public.boost_packages.duration_days IS 'Durée du boost en jours - 1 / 7 / 30';

-- ═══════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════

-- Voir les packages créés
SELECT 
    name,
    duration_days || ' jours' as durée,
    price || ' FCFA' as prix,
    description,
    active
FROM public.boost_packages
ORDER BY price ASC;

-- Résultat attendu :
-- Express  | 1 jour   | 500 FCFA   | Boost 24h...
-- Pro      | 7 jours  | 2000 FCFA  | Boost 1 semaine...
-- Premium  | 30 jours | 6000 FCFA  | Boost 1 mois...

-- ═══════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- Packages ready avec pricing psychologique validé ✅
-- ═══════════════════════════════════════════════════════════

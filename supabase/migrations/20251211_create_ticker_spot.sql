-- Migration: Create Ticker Spot Table for "King of the Hill" Feature
-- Description: Single row table to track the current "star listing" displayed in top ticker bar
-- Users pay 200 FCFA to claim the spot, can be replaced at any time by another payment

-- Create ticker_spot table
CREATE TABLE IF NOT EXISTS public.ticker_spot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only ONE row can exist (single ticker spot)
CREATE UNIQUE INDEX IF NOT EXISTS single_ticker_spot 
ON public.ticker_spot ((id IS NOT NULL));

-- Insert the single ticker spot row (empty initially)
INSERT INTO public.ticker_spot (id, current_listing_id, owner_id)
VALUES (gen_random_uuid(), NULL, NULL)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.ticker_spot ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view the ticker spot
CREATE POLICY "Public can view ticker spot"
ON public.ticker_spot
FOR SELECT
TO public
USING (true);

-- RLS Policy: Only authenticated users can update (via Edge Function)
CREATE POLICY "Service role can update ticker spot"
ON public.ticker_spot
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Add ticker package to boost_packages
INSERT INTO public.boost_packages (name, duration_days, price, description, active)
VALUES (
    'Ticker Star',
    0, -- No duration - lasts until replaced
    200, -- 200 FCFA
    'Affichez votre annonce en haut du site jusqu''à être remplacé ! Position #1 garantie.',
    true
)
ON CONFLICT (name) DO UPDATE 
SET price = 200, description = 'Affichez votre annonce en haut du site jusqu''à être remplacé ! Position #1 garantie.';

-- Create function to update ticker spot (called by Edge Function after payment)
CREATE OR REPLACE FUNCTION update_ticker_spot(
    p_listing_id UUID,
    p_owner_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- UPDATE with WHERE clause (required by PostgreSQL to avoid error 21000)
    UPDATE public.ticker_spot
    SET 
        current_listing_id = p_listing_id,
        owner_id = p_owner_id,
        claimed_at = NOW(),
        updated_at = NOW()
    WHERE true;  -- Required: WHERE clause prevents PostgreSQL error
    
    -- If no row exists, INSERT new one
    IF NOT FOUND THEN
        INSERT INTO public.ticker_spot (id, current_listing_id, owner_id, claimed_at, updated_at)
        VALUES (gen_random_uuid(), p_listing_id, p_owner_id, NOW(), NOW());
    END IF;
END;
$$;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION update_ticker_spot(UUID, UUID) TO authenticated;

COMMENT ON TABLE public.ticker_spot IS 'Single row table tracking the current "King of the Hill" listing displayed in top ticker bar';
COMMENT ON COLUMN public.ticker_spot.current_listing_id IS 'The listing currently displayed in the ticker';
COMMENT ON COLUMN public.ticker_spot.owner_id IS 'User who paid to claim this spot';
COMMENT ON COLUMN public.ticker_spot.claimed_at IS 'When the current spot was claimed';
COMMENT ON COLUMN public.ticker_spot.updated_at IS 'Last update timestamp';

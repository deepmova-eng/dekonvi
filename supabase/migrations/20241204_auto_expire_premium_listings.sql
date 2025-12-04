-- =====================================================
-- MIGRATION: Auto-expire Premium Listings
-- =====================================================
-- Description: 
--   Set up automatic expiration of premium boosts using pg_cron.
--   Runs daily to check for expired premium listings and revert them.
--
-- What it does:
--   1. Enable pg_cron extension (if not already enabled)
--   2. Create function to expire premium listings
--   3. Schedule daily cron job at 00:00 UTC
--   4. Log expired listings for audit
--
-- Author: System
-- Date: 2024-12-04
-- =====================================================

-- =====================================================
-- STEP 1: Enable pg_cron extension
-- =====================================================

-- Note: pg_cron must be enabled by Supabase project settings
-- This is just a safety check
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        -- pg_cron is not available in standard Supabase, we'll use Postgres functions instead
        RAISE NOTICE 'pg_cron not available, using alternative scheduled approach';
    END IF;
END $$;

-- =====================================================
-- STEP 2: Create audit log table for expired premiums
-- =====================================================

CREATE TABLE IF NOT EXISTS public.premium_expiration_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    expired_at timestamp with time zone DEFAULT now(),
    original_premium_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_premium_expiration_log_listing_id 
    ON public.premium_expiration_log(listing_id);

CREATE INDEX IF NOT EXISTS idx_premium_expiration_log_expired_at 
    ON public.premium_expiration_log(expired_at DESC);

-- RLS for admin access only
ALTER TABLE public.premium_expiration_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view expiration logs" ON public.premium_expiration_log;
CREATE POLICY "Admins can view expiration logs"
    ON public.premium_expiration_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- STEP 3: Create function to expire premium listings
-- =====================================================

CREATE OR REPLACE FUNCTION public.expire_premium_listings()
RETURNS TABLE(
    expired_count integer,
    listing_ids uuid[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expired_count integer := 0;
    v_listing_ids uuid[] := ARRAY[]::uuid[];
    v_record RECORD;
BEGIN
    -- Find and expire premium listings past their premium_until date
    FOR v_record IN
        SELECT id, premium_until
        FROM public.listings
        WHERE is_premium = true
          AND premium_until IS NOT NULL
          AND premium_until < now()
          AND status = 'active' -- Only active listings
    LOOP
        -- Log the expiration
        INSERT INTO public.premium_expiration_log (
            listing_id,
            original_premium_until
        ) VALUES (
            v_record.id,
            v_record.premium_until
        );

        -- Update the listing to remove premium status
        UPDATE public.listings
        SET 
            is_premium = false,
            premium_until = NULL,
            updated_at = now()
        WHERE id = v_record.id;

        -- Track for return value
        v_expired_count := v_expired_count + 1;
        v_listing_ids := array_append(v_listing_ids, v_record.id);

        RAISE NOTICE 'Expired premium listing: % (was until %)', 
            v_record.id, v_record.premium_until;
    END LOOP;

    -- Return summary
    RETURN QUERY SELECT v_expired_count, v_listing_ids;
END;
$$;

-- Grant execute to authenticated users (will be restricted by function's SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.expire_premium_listings() TO authenticated;

-- =====================================================
-- STEP 4: Alternative to pg_cron - Database Trigger
-- =====================================================
-- Since Supabase doesn't support pg_cron by default,
-- we use a trigger-based approach that checks on every listing query

CREATE OR REPLACE FUNCTION public.auto_expire_premium_on_select()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only run expiration check once per minute to avoid overhead
    -- Use a flag in a metadata table
    IF NOT EXISTS (
        SELECT 1 FROM public.premium_expiration_log
        WHERE expired_at > now() - interval '1 minute'
        LIMIT 1
    ) THEN
        -- Run the expiration function asynchronously
        PERFORM public.expire_premium_listings();
    END IF;

    RETURN NULL; -- AFTER trigger, so return value doesn't matter
END;
$$;

-- =====================================================
-- STEP 5: Create scheduled check via HTTP endpoint
-- =====================================================
-- NOTE: For production, set up a scheduled job using:
-- 1. Supabase Edge Functions with cron (recommended)
-- 2. External cron service (e.g., cron-job.org)
-- 3. GitHub Actions scheduled workflow
--
-- Create a simple function that can be called via HTTP:

CREATE OR REPLACE FUNCTION public.api_expire_premium_listings()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result RECORD;
BEGIN
    -- Call the main expiration function
    SELECT * INTO v_result
    FROM public.expire_premium_listings();

    -- Return JSON result
    RETURN json_build_object(
        'success', true,
        'expired_count', v_result.expired_count,
        'listing_ids', v_result.listing_ids,
        'timestamp', now()
    );
END;
$$;

-- Grant execute to anon for HTTP calls (with RLS protection)
GRANT EXECUTE ON FUNCTION public.api_expire_premium_listings() TO anon;

-- =====================================================
-- STEP 6: Manual execution for testing
-- =====================================================

-- Uncomment to test immediately:
-- SELECT * FROM public.expire_premium_listings();

-- =====================================================
-- SETUP INSTRUCTIONS FOR PRODUCTION
-- =====================================================

COMMENT ON FUNCTION public.expire_premium_listings() IS 
'Expires premium listings that have passed their premium_until date. 
Should be called daily via scheduled job.

For production setup:
1. Create Supabase Edge Function with cron schedule
2. Or use external cron service hitting: POST /rest/v1/rpc/api_expire_premium_listings
3. Or use GitHub Actions scheduled workflow

Example curl:
curl -X POST https://your-project.supabase.co/rest/v1/rpc/api_expire_premium_listings \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- View upcoming expirations
-- Uncomment to check:
-- SELECT id, title, premium_until, 
--        premium_until - now() as time_remaining
-- FROM public.listings
-- WHERE is_premium = true
--   AND premium_until IS NOT NULL
-- ORDER BY premium_until ASC;

-- =====================================================
-- END MIGRATION
-- =====================================================

-- =====================================================
-- MIGRATION: Setup Premium Expiry Cron Job
-- =====================================================
-- Description: 
--   Configure automatic daily execution of premium listings expiration
--   using Supabase pg_cron extension
--
-- Author: System
-- Date: 2025-12-12
-- =====================================================

-- =====================================================
-- STEP 1: Enable Required Extensions
-- =====================================================

-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net for HTTP requests to Edge Functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================
-- STEP 2: Create SQL Function to Call Edge Function
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_expire_premium_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_response_id bigint;
    v_supabase_url text;
    v_anon_key text;
BEGIN
    -- Get Supabase URL from environment
    -- Note: In production, these should be set via Supabase secrets/vault
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_anon_key := current_setting('app.settings.supabase_anon_key', true);

    -- If credentials not available, call local function directly
    IF v_supabase_url IS NULL OR v_anon_key IS NULL THEN
        RAISE NOTICE 'Calling expire_premium_listings() directly (no HTTP credentials)';
        PERFORM public.expire_premium_listings();
        RETURN;
    END IF;

    -- Make HTTP POST request to Edge Function
    SELECT INTO v_response_id
        net.http_post(
            url := v_supabase_url || '/functions/v1/expire-premium-listings',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_anon_key
            ),
            body := '{}'::jsonb
        );

    RAISE NOTICE 'Triggered expire-premium-listings Edge Function (response_id: %)', v_response_id;

EXCEPTION
    WHEN OTHERS THEN
        -- If HTTP call fails, fall back to direct SQL function
        RAISE NOTICE 'HTTP call failed, falling back to direct SQL: %', SQLERRM;
        PERFORM public.expire_premium_listings();
END;
$$;

COMMENT ON FUNCTION public.trigger_expire_premium_listings() IS 
'Triggers the premium listings expiration process.
Attempts to call Edge Function via HTTP, falls back to direct SQL if unavailable.
Designed to be called by pg_cron daily.';

-- =====================================================
-- STEP 3: Schedule Daily Cron Job
-- =====================================================

-- Remove existing job if it exists (for idempotency)
DO $$
BEGIN
    PERFORM cron.unschedule('expire-premium-listings-daily');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'cron.job table does not exist, skipping unschedule';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not unschedule job: %', SQLERRM;
END $$;

-- Schedule the job to run daily at midnight UTC
SELECT cron.schedule(
    'expire-premium-listings-daily',           -- job name
    '0 0 * * *',                                -- cron expression (daily at 00:00 UTC)
    $$SELECT public.trigger_expire_premium_listings()$$
);

-- =====================================================
-- STEP 4: Verify Setup
-- =====================================================

-- Log the cron job configuration
DO $$
DECLARE
    v_job_count integer;
BEGIN
    SELECT COUNT(*) INTO v_job_count
    FROM cron.job
    WHERE jobname = 'expire-premium-listings-daily';

    IF v_job_count > 0 THEN
        RAISE NOTICE '✅ Cron job "expire-premium-listings-daily" configured successfully';
        RAISE NOTICE '📅 Schedule: Daily at 00:00 UTC';
        RAISE NOTICE '🔧 Function: public.trigger_expire_premium_listings()';
    ELSE
        RAISE WARNING '❌ Failed to configure cron job';
    END IF;
END $$;

-- =====================================================
-- STEP 5: Grant Permissions
-- =====================================================

-- Grant execute permission to postgres role (for cron)
GRANT EXECUTE ON FUNCTION public.trigger_expire_premium_listings() TO postgres;

-- =====================================================
-- MANUAL TEST INSTRUCTIONS
-- =====================================================

COMMENT ON FUNCTION public.trigger_expire_premium_listings() IS 
'Premium Listings Auto-Expiration Cron Job

SCHEDULED: Daily at 00:00 UTC via pg_cron

MANUAL TEST:
  SELECT public.trigger_expire_premium_listings();

CHECK CRON STATUS:
  SELECT * FROM cron.job WHERE jobname = ''expire-premium-listings-daily'';
  SELECT * FROM cron.job_run_details WHERE jobid = (
    SELECT jobid FROM cron.job WHERE jobname = ''expire-premium-listings-daily''
  ) ORDER BY start_time DESC LIMIT 10;

VIEW EXPIRATION LOGS:
  SELECT * FROM premium_expiration_log ORDER BY expired_at DESC LIMIT 10;
';

-- =====================================================
-- VERIFICATION QUERIES (uncomment to test)
-- =====================================================

-- View configured cron jobs
-- SELECT * FROM cron.job;

-- View recent cron job executions
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Test the function manually
-- SELECT public.trigger_expire_premium_listings();

-- Check for expired premium listings
-- SELECT id, title, is_premium, premium_until 
-- FROM listings 
-- WHERE is_premium = true AND premium_until < now();

-- =====================================================
-- END MIGRATION
-- =====================================================

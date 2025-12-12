-- =====================================================
-- HOTFIX: Remove updated_at from expire_premium_listings
-- =====================================================
-- Description: 
--   Fix SQL error - column "updated_at" does not exist in listings table
--
-- Date: 2025-12-12
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
        -- FIXED: Removed updated_at which doesn't exist
        UPDATE public.listings
        SET 
            is_premium = false,
            premium_until = NULL
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

-- =====================================================
-- Test immediately
-- =====================================================

SELECT * FROM expire_premium_listings();

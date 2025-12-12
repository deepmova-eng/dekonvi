-- =====================================================
-- Admin Manual Boost Control
-- =====================================================
-- Description: Allows admins to manually expire boosts with audit logging

-- 1. Create audit log table
CREATE TABLE IF NOT EXISTS public.boost_manual_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('expire', 'extend', 'cancel')),
    reason TEXT,
    previous_premium_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.boost_manual_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view logs
CREATE POLICY "Admins can view boost action logs"
    ON public.boost_manual_actions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Function to manually expire a boost
CREATE OR REPLACE FUNCTION public.admin_expire_boost(
    p_listing_id UUID,
    p_reason TEXT DEFAULT 'Manual admin action'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_previous_premium_until TIMESTAMPTZ;
    v_was_premium BOOLEAN;
BEGIN
    -- Get current user (must be admin)
    v_admin_id := auth.uid();
    
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Verify admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = v_admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Admin privileges required';
    END IF;
    
    -- Get current boost status
    SELECT is_premium, premium_until
    INTO v_was_premium, v_previous_premium_until
    FROM public.listings
    WHERE id = p_listing_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Listing not found';
    END IF;
    
    IF NOT v_was_premium THEN
        RAISE EXCEPTION 'Listing is not currently boosted';
    END IF;
    
    -- Remove boost
    UPDATE public.listings
    SET 
        is_premium = false,
        premium_until = NULL
    WHERE id = p_listing_id;
    
    -- Log action
    INSERT INTO public.boost_manual_actions (
        admin_id,
        listing_id,
        action,
        reason,
        previous_premium_until
    ) VALUES (
        v_admin_id,
        p_listing_id,
        'expire',
        p_reason,
        v_previous_premium_until
    );
    
    RETURN json_build_object(
        'success', true,
        'listing_id', p_listing_id,
        'previous_premium_until', v_previous_premium_until,
        'expired_by', v_admin_id
    );
END;
$$;

-- Grant execute to authenticated users (function checks admin internally)
GRANT EXECUTE ON FUNCTION public.admin_expire_boost(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.admin_expire_boost(UUID, TEXT) IS 
'Manually expire a boost for a listing. Admin only. Logs action for audit trail.';

COMMENT ON TABLE public.boost_manual_actions IS 
'Audit log for manual boost actions performed by admins.';

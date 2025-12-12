-- =====================================================
-- Function: Get Active Boosts for Admin Panel
-- =====================================================
-- Description: Returns all active boosts with details for monitoring

CREATE OR REPLACE FUNCTION public.get_active_boosts_admin()
RETURNS TABLE (
    id UUID,
    title TEXT,
    images TEXT[],
    seller_id UUID,
    seller_name TEXT,
    package_name TEXT,
    premium_until TIMESTAMPTZ,
    amount INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id AS id,
        l.title AS title,
        l.images AS images,
        l.seller_id AS seller_id,
        COALESCE(p.name, 'Utilisateur inconnu')::TEXT AS seller_name,
        COALESCE(t.package_name, 'Package inconnu')::TEXT AS package_name,
        l.premium_until AS premium_until,
        COALESCE(t.amount, 0)::INTEGER AS amount
    FROM listings l
    JOIN profiles p ON p.id = l.seller_id
    LEFT JOIN LATERAL (
        SELECT bp.name AS package_name, trans.amount
        FROM transactions trans
        JOIN boost_packages bp ON bp.id = trans.package_id
        WHERE trans.listing_id = l.id
          AND trans.status = 'success'
        ORDER BY trans.created_at DESC
        LIMIT 1
    ) t ON true
    WHERE l.is_premium = true
      AND l.premium_until > now()
      AND l.status = 'active'
    ORDER BY l.premium_until ASC;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_active_boosts_admin() TO authenticated;

COMMENT ON FUNCTION public.get_active_boosts_admin() IS 
'Returns all active boosts with details for admin monitoring panel.
Includes seller name, package name, expiry time, and amount paid.';

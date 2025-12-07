-- Check if approved boost requests have updated listings.is_premium
-- This will show if there's a sync issue between premium_requests and listings

SELECT 
    pr.id as request_id,
    pr.listing_id,
    l.title as listing_title,
    pr.status as request_status,
    l.is_premium as listing_is_premium,
    pr.created_at as request_date,
    CASE 
        WHEN pr.status = 'approved' AND l.is_premium = false THEN '❌ SYNC ISSUE: Approved but not premium'
        WHEN pr.status = 'approved' AND l.is_premium = true THEN '✅ OK: Approved and premium'
        WHEN pr.status = 'pending' THEN '⏳ Pending'
        WHEN pr.status = 'rejected' THEN '❌ Rejected'
    END as sync_status
FROM premium_requests pr
LEFT JOIN listings l ON l.id = pr.listing_id
WHERE pr.status IN ('pending', 'approved')
ORDER BY pr.created_at DESC;

-- Also check for orphaned approved requests (listing doesn't exist)
SELECT 
    pr.id,
    pr.listing_id,
    pr.status,
    CASE 
        WHEN l.id IS NULL THEN '❌ ORPHAN: Listing deleted'
        ELSE '✅ OK'
    END as listing_exists
FROM premium_requests pr
LEFT JOIN listings l ON l.id = pr.listing_id
WHERE pr.status = 'approved'
AND l.id IS NULL;

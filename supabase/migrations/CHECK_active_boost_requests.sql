-- Check which listing is causing the duplicate error
-- Replace 'YOUR_LISTING_ID' with the ID of the problematic listing

-- 1. Show ALL requests for a specific listing (replace the listing_id)
-- SELECT * FROM premium_requests WHERE listing_id = 'YOUR_LISTING_ID' ORDER BY created_at DESC;

-- 2. Show all PENDING/APPROVED requests
SELECT 
    pr.id,
    pr.listing_id,
    l.title as listing_title,
    pr.user_id,
    pr.status,
    pr.created_at,
    CASE 
        WHEN pr.status = 'pending' THEN '⏳ En attente'
        WHEN pr.status = 'approved' THEN '✅ Approuvé (Boost actif)'
        WHEN pr.status = 'rejected' THEN '❌ Rejeté'
    END as status_label
FROM premium_requests pr
LEFT JOIN listings l ON l.id = pr.listing_id
WHERE pr.status IN ('pending', 'approved')
ORDER BY pr.created_at DESC;

-- 3. Count requests by status
SELECT 
    status,
    COUNT(*) as count
FROM premium_requests
GROUP BY status
ORDER BY status;

-- IMMEDIATE FIX: Sync approved premium requests with listings.is_premium
-- This will fix the 4 listings that are approved but not marked as premium

-- STEP 1: Sync all approved requests to listings
-- This updates is_premium = true for all listings with approved requests
UPDATE listings
SET is_premium = true
WHERE id IN (
    SELECT listing_id 
    FROM premium_requests 
    WHERE status = 'approved'
);

-- STEP 2: Sync all non-approved requests to listings
-- This ensures listings without approved requests are not premium
UPDATE listings
SET is_premium = false
WHERE id NOT IN (
    SELECT listing_id 
    FROM premium_requests 
    WHERE status = 'approved'
)
AND is_premium = true;

-- STEP 3: Show what was fixed
SELECT 
    l.id,
    l.title,
    l.is_premium,
    pr.status as request_status,
    '✅ FIXED' as status
FROM listings l
INNER JOIN premium_requests pr ON pr.listing_id = l.id
WHERE pr.status = 'approved'
AND l.is_premium = true
ORDER BY l.title;

-- STEP 4: Verification - Check if any sync issues remain
SELECT 
    COUNT(*) as remaining_sync_issues
FROM premium_requests pr
LEFT JOIN listings l ON l.id = pr.listing_id
WHERE pr.status = 'approved' 
AND (l.is_premium = false OR l.is_premium IS NULL);

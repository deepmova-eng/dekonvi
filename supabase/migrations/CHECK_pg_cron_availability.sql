-- =====================================================
-- CHECK: Verify pg_cron Extension Availability
-- =====================================================
-- Run this in Supabase SQL Editor to check if pg_cron is available
-- =====================================================

-- 1. Check if pg_cron extension is installed
SELECT 
    extname AS extension_name,
    extversion AS version,
    'Installed' AS status
FROM pg_extension
WHERE extname = 'pg_cron';

-- 2. Check if pg_net extension is installed (needed for HTTP calls)
SELECT 
    extname AS extension_name,
    extversion AS version,
    'Installed' AS status
FROM pg_extension
WHERE extname = 'pg_net';

-- 3. List all available extensions
SELECT 
    name,
    default_version,
    comment
FROM pg_available_extensions
WHERE name IN ('pg_cron', 'pg_net')
ORDER BY name;

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- If pg_cron is available, you'll see it listed
-- If not available, we'll use GitHub Actions instead
-- =====================================================

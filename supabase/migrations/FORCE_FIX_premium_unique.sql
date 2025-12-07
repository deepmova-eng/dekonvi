-- FORCE FIX: Nuclear option to completely remove all UNIQUE constraints
-- This version will force-remove everything and rebuild from scratch

-- STEP 1: Drop the table's UNIQUE constraint by name (if it exists)
ALTER TABLE premium_requests DROP CONSTRAINT IF EXISTS premium_requests_listing_id_key;

-- STEP 2: Drop ANY other unique constraints that might exist
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'premium_requests'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%listing_id%'
    LOOP
        EXECUTE 'ALTER TABLE premium_requests DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
        RAISE NOTICE 'Dropped constraint: %', r.constraint_name;
    END LOOP;
END $$;

-- STEP 3: Drop any UNIQUE indexes on listing_id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'premium_requests'
        AND indexdef LIKE '%UNIQUE%'
        AND indexdef LIKE '%listing_id%'
        AND indexname != 'unique_active_premium_request'
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname);
        RAISE NOTICE 'Dropped index: %', r.indexname;
    END LOOP;
END $$;

-- STEP 4: Clean up our partial index if it exists (to recreate fresh)
DROP INDEX IF EXISTS unique_active_premium_request;

-- STEP 5: Create the new partial UNIQUE index
CREATE UNIQUE INDEX unique_active_premium_request 
ON premium_requests(listing_id) 
WHERE status IN ('pending', 'approved');

-- STEP 6: Verification - Show what's left
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Checking final state...';
END $$;

-- Show all constraints
SELECT 
    'CONSTRAINT' as type,
    conname as name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'premium_requests'::regclass
AND contype = 'u'
UNION ALL
-- Show all indexes
SELECT 
    'INDEX' as type,
    indexname as name,
    indexdef as definition
FROM pg_indexes
WHERE tablename = 'premium_requests'
AND indexdef LIKE '%UNIQUE%'
ORDER BY type, name;

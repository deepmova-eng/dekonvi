-- Enhanced fix for rejected boost requests
-- This version checks for all existing constraints and removes them properly

-- Step 1: Drop ALL possible UNIQUE constraints on listing_id
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find all UNIQUE constraints on listing_id column
    FOR constraint_name IN 
        SELECT con.conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE rel.relname = 'premium_requests'
        AND att.attname = 'listing_id'
        AND con.contype = 'u'  -- UNIQUE constraint
    LOOP
        EXECUTE format('ALTER TABLE premium_requests DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Step 2: Drop any existing partial unique index (in case of re-run)
DROP INDEX IF EXISTS unique_active_premium_request;

-- Step 3: Create the new partial UNIQUE index
CREATE UNIQUE INDEX unique_active_premium_request 
ON premium_requests(listing_id) 
WHERE status IN ('pending', 'approved');

-- Step 4: Add helpful comment
COMMENT ON INDEX unique_active_premium_request IS 
'Ensures only one active (pending/approved) premium request per listing. Allows multiple rejected requests for re-submission.';

-- Step 5: Verification query
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully';
    RAISE NOTICE 'Checking current constraints...';
END $$;

-- Show current indexes and constraints on premium_requests
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'premium_requests'
ORDER BY indexname;

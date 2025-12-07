-- DIAGNOSTIC: Check current state of premium_requests constraints
-- Run this to see what constraints exist

-- 1. Check all UNIQUE constraints on premium_requests
SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    att.attname AS column_name
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
WHERE rel.relname = 'premium_requests'
AND con.contype = 'u'  -- UNIQUE constraints only
ORDER BY con.conname;

-- 2. Check all indexes on premium_requests
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'premium_requests'
ORDER BY indexname;

-- 3. Check if partial index exists
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'premium_requests'
AND indexname = 'unique_active_premium_request';

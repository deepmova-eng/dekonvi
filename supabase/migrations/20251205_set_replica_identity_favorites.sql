-- ============================================
-- FIX: Enable REPLICA IDENTITY FULL for favorites
-- ============================================

-- Check current replica identity (before)
SELECT 
    nspname as schema,
    relname as table_name,
    CASE relreplident
        WHEN 'd' THEN 'default (primary key)'
        WHEN 'n' THEN 'nothing'
        WHEN 'f' THEN 'full'
        WHEN 'i' THEN 'index'
    END as replica_identity
FROM pg_class 
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE relname = 'favorites'
AND nspname = 'public';

-- Set REPLICA IDENTITY to FULL
ALTER TABLE public.favorites REPLICA IDENTITY FULL;

-- Check again (after)
SELECT 
    nspname as schema,
    relname as table_name,
    CASE relreplident
        WHEN 'd' THEN 'default (primary key)'
        WHEN 'n' THEN 'nothing'
        WHEN 'f' THEN 'full'
        WHEN 'i' THEN 'index'
    END as replica_identity
FROM pg_class 
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE relname = 'favorites'
AND nspname = 'public';

-- ============================================
-- CHECK: Verify publication configuration
-- ============================================

-- Check if favorites is in supabase_realtime publication
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE tablename = 'favorites'
  AND pubname = 'supabase_realtime';

-- Check publication configuration (which events are published)
SELECT 
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- If pubdelete is FALSE, that's the problem!
-- We need to ALTER the publication to include DELETE events

-- Expected results:
-- - favorites should be in supabase_realtime publication
-- - pubinsert = true
-- - pubupdate = true  
-- - pubdelete = true (THIS IS CRITICAL!)

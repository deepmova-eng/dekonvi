-- ═══════════════════════════════════════════════════════════
-- Enable Realtime on favorites table
-- ═══════════════════════════════════════════════════════════
-- This allows the frontend to subscribe to real-time changes
-- on favorites (INSERT/DELETE events) so the UI updates instantly
-- without requiring a manual page refresh.

ALTER PUBLICATION supabase_realtime ADD TABLE favorites;

-- Verify the table is now in the publication
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'favorites';

-- ═══════════════════════════════════════════════════════════
-- If everything is OK, you should see 'favorites' listed above
-- ═══════════════════════════════════════════════════════════

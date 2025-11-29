-- ============================================
-- REMOVE AUTO-RESTORE TRIGGER
-- ============================================
-- The trigger was deleting conversation_deletions rows,
-- losing the deleted_at timestamp needed for filtering.
-- This migration removes the problematic trigger.

-- 1. Drop the trigger
DROP TRIGGER IF EXISTS restore_conversation_trigger ON messages;

-- 2. Drop the associated function
DROP FUNCTION IF EXISTS restore_conversation_on_new_message();

-- 3. Remove unnecessary columns if they exist
ALTER TABLE conversation_deletions DROP COLUMN IF EXISTS restored;
ALTER TABLE conversation_deletions DROP COLUMN IF EXISTS active;

-- 4. Verification
SELECT 
  trigger_name, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%restore_conversation%';

-- Should return 0 rows

COMMENT ON TABLE conversation_deletions IS 
'Static log of conversation deletions. Rows are never modified by triggers.
deleted_at timestamp is used client-side to filter messages.';

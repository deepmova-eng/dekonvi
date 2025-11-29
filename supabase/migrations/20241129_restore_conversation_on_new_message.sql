-- ============================================
-- AUTO-RESTORE CONVERSATION ON NEW MESSAGE
-- ============================================
-- When a new message arrives in a soft-deleted conversation,
-- automatically restore it for the recipient (WhatsApp/Messenger behavior)

-- Function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION restore_conversation_on_new_message()
RETURNS TRIGGER
SECURITY DEFINER -- Allows bypassing RLS to delete from conversation_deletions
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  other_user_id UUID;
BEGIN
  -- Determine the recipient (the other participant)
  SELECT CASE 
    WHEN user1_id = NEW.sender_id THEN user2_id
    ELSE user1_id
  END INTO other_user_id
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Restore the conversation for the recipient by removing soft-delete
  DELETE FROM conversation_deletions
  WHERE conversation_id = NEW.conversation_id
    AND user_id = other_user_id;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS restore_conversation_trigger ON messages;

CREATE TRIGGER restore_conversation_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION restore_conversation_on_new_message();

-- Verification
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'restore_conversation_trigger';

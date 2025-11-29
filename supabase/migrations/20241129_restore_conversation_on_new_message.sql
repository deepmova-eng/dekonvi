-- ============================================
-- AUTO-RESTORE CONVERSATION ON NEW MESSAGE
-- ============================================
-- When a new message arrives in a soft-deleted conversation,
-- automatically restore it for the recipient

-- Function to restore conversation when new message arrives
CREATE OR REPLACE FUNCTION restore_conversation_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  conversation_participants UUID[];
  other_user_id UUID;
BEGIN
  -- Get the conversation participants
  SELECT ARRAY[user1_id, user2_id] INTO conversation_participants
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Determine the other user (recipient)
  IF conversation_participants[1] = NEW.sender_id THEN
    other_user_id := conversation_participants[2];
  ELSE
    other_user_id := conversation_participants[1];
  END IF;

  -- Delete the soft-delete entry for the recipient if it exists
  -- This "restores" the conversation for them
  DELETE FROM conversation_deletions
  WHERE conversation_id = NEW.conversation_id
    AND user_id = other_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

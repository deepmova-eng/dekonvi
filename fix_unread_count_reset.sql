-- Fix: Reset conversation unread_count when entering a conversation
-- This ensures badges disappear when you read messages

-- Function to recalculate and update unread_count for a conversation
create or replace function public.recalculate_conversation_unread()
returns trigger as $$
declare
  conversation_unread_count integer;
begin
  -- Count unread messages for this conversation (excluding messages sent by the current user viewing)
  -- We'll just count all unread messages for simplicity
  select count(*) into conversation_unread_count
  from public.messages
  where conversation_id = new.conversation_id
  and read = false;
  
  -- Update the conversation's unread_count
  update public.conversations
  set unread_count = conversation_unread_count
  where id = new.conversation_id;
  
  return new;
end;
$$ language plpgsql security definer;

-- Drop and recreate the trigger
drop trigger if exists on_message_read_recalculate_unread on public.messages;

create trigger on_message_read_recalculate_unread
  after update on public.messages
  for each row 
  when (old.read = false and new.read = true)
  execute function public.recalculate_conversation_unread();

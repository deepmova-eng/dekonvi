-- Update unread_count in conversations when a new message is inserted
-- This enables the badge on the Messages tab to update in real-time

create or replace function public.update_conversation_unread_count()
returns trigger as $$
begin
  -- Increment unread_count for the conversation
  update public.conversations
  set unread_count = unread_count + 1
  where id = new.conversation_id;
  
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists on_new_message_update_unread on public.messages;

-- Create trigger to update unread count when a message is inserted
create trigger on_new_message_update_unread
  after insert on public.messages
  for each row execute function public.update_conversation_unread_count();

-- Also create a trigger to reset unread_count when messages are marked as read
create or replace function public.reset_conversation_unread_count()
returns trigger as $$
begin
  -- If a message is marked as read, decrement the unread count
  if old.read = false and new.read = true then
    update public.conversations
    set unread_count = greatest(0, unread_count - 1)
    where id = new.conversation_id;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists on_message_read_update_unread on public.messages;

-- Create trigger to update unread count when a message is marked as read
create trigger on_message_read_update_unread
  after update on public.messages
  for each row execute function public.reset_conversation_unread_count();

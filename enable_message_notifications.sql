-- Enable real-time message notifications
-- This creates a trigger that automatically creates a notification when a message is sent

-- Function to create a notification when a new message is sent
create or replace function public.handle_new_message_notification()
returns trigger as $$
declare
  recipient_id uuid;
  sender_name text;
begin
  -- Get the recipient ID (the other participant in the conversation)
  select p.id into recipient_id
  from public.conversations c, unnest(c.participants) as p(id)
  where c.id = new.conversation_id
  and p.id != new.sender_id;

  -- Get sender name
  select name into sender_name
  from public.profiles
  where id = new.sender_id;

  -- Insert notification
  if recipient_id is not null then
    insert into public.notifications (user_id, type, title, content, link)
    values (
      recipient_id,
      'message',
      'Nouveau message',
      coalesce(sender_name, 'Un utilisateur') || ' vous a envoyé un message',
      '/messages?conversation=' || new.conversation_id
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists on_new_message_notification on public.messages;

-- Create trigger for new messages
create trigger on_new_message_notification
  after insert on public.messages
  for each row execute function public.handle_new_message_notification();

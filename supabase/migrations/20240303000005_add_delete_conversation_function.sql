-- Function to delete a conversation and its messages
create or replace function delete_conversation(conversation_id uuid, user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Verify user is a participant
  if not exists (
    select 1 from conversations
    where id = conversation_id
    and user_id = any(participants)
  ) then
    raise exception 'User is not a participant in this conversation';
  end if;

  -- Delete messages
  delete from messages
  where conversation_id = conversation_id;

  -- Delete conversation
  delete from conversations
  where id = conversation_id;
end;
$$;
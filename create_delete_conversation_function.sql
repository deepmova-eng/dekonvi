-- Drop the existing function first to allow parameter renaming
DROP FUNCTION IF EXISTS public.delete_conversation(uuid, uuid);

-- Re-create the function with unambiguous parameter names
create or replace function public.delete_conversation(
  p_conversation_id uuid,
  p_user_id uuid
)
returns void as $$
begin
  -- Check if the user is a participant of the conversation
  if not exists (
    select 1 from public.conversations
    where id = p_conversation_id
    and participants @> ARRAY[p_user_id]::uuid[]
  ) then
    raise exception 'User is not a participant of this conversation';
  end if;

  -- Delete all messages in the conversation first
  delete from public.messages
  where conversation_id = p_conversation_id;

  -- Delete the conversation
  delete from public.conversations
  where id = p_conversation_id;
end;
$$ language plpgsql security definer;

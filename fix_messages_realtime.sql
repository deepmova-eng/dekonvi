-- Enable Realtime for messages table
alter publication supabase_realtime add table messages;

-- Ensure RLS is enabled
alter table messages enable row level security;

-- Policy for viewing messages (needed for realtime subscription to work)
drop policy if exists "Users can view messages in their conversations" on messages;
create policy "Users can view messages in their conversations"
  on messages for select
  using (
    auth.uid() = sender_id 
    or 
    exists (
      select 1 from conversations
      where id = messages.conversation_id
      and auth.uid() = any(participants)
    )
  );

-- Policy for inserting messages
drop policy if exists "Users can insert messages in their conversations" on messages;
create policy "Users can insert messages in their conversations"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and
    exists (
      select 1 from conversations
      where id = conversation_id
      and auth.uid() = any(participants)
    )
  );

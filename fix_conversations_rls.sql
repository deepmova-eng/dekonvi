-- Allow users to update conversations they are part of (e.g. to update last_message)
create policy "Users can update their own conversations"
  on public.conversations for update
  using (auth.uid() = any(participants));

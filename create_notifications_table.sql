-- Create notifications table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('message', 'system', 'alert', 'premium')),
  title text not null,
  content text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Index for performance
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_read_idx on public.notifications(read);
create index notifications_created_at_idx on public.notifications(created_at desc);

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

-- Trigger for new messages
drop trigger if exists on_new_message_notification on public.messages;
create trigger on_new_message_notification
  after insert on public.messages
  for each row execute function public.handle_new_message_notification();

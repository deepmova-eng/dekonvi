-- Create notifications table if it doesn't exist
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

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;
drop policy if exists "Users can delete their own notifications" on public.notifications;

-- Policy: SELECT - Users can only view their own notifications
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Policy: UPDATE - Users can only update their own notifications (for marking as read)
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Policy: DELETE - Users can only delete their own notifications
create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_idx on public.notifications(read);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

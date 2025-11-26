-- Enable RLS on notifications table if not already enabled
alter table notifications enable row level security;

-- Policy to allow users to SELECT their own notifications
create policy "Users can view their own notifications"
on notifications for select
using (auth.uid() = user_id);

-- Policy to allow users to UPDATE their own notifications (mark as read)
create policy "Users can update their own notifications"
on notifications for update
using (auth.uid() = user_id);

-- Policy to allow users to DELETE their own notifications
create policy "Users can delete their own notifications"
on notifications for delete
using (auth.uid() = user_id);

-- Grant access to authenticated users
grant all on notifications to authenticated;

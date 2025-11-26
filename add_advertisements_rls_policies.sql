-- Add RLS policies for advertisements table
-- Execute this in Supabase Dashboard > SQL Editor

-- Allow admins to insert advertisements
create policy "Admins can create advertisements"
  on public.advertisements for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Allow admins to update advertisements
create policy "Admins can update advertisements"
  on public.advertisements for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Allow admins to delete advertisements
create policy "Admins can delete advertisements"
  on public.advertisements for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Allow admins to view all advertisements (not just active ones)
create policy "Admins can view all advertisements"
  on public.advertisements for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

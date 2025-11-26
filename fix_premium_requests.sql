-- Create premium_requests table if it doesn't exist
create table if not exists public.premium_requests (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  duration integer not null,
  price numeric not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.premium_requests enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Users can view their own premium requests" on public.premium_requests;
drop policy if exists "Users can create premium requests" on public.premium_requests;
drop policy if exists "Admins can view all premium requests" on public.premium_requests;
drop policy if exists "Admins can update premium requests" on public.premium_requests;

-- Create User policies
create policy "Users can view their own premium requests"
  on public.premium_requests for select
  using (auth.uid() = seller_id);

create policy "Users can create premium requests"
  on public.premium_requests for insert
  with check (auth.uid() = seller_id);

-- Create Admin policies
create policy "Admins can view all premium requests"
  on public.premium_requests for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can update premium requests"
  on public.premium_requests for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Grant permissions
grant all on public.premium_requests to authenticated;
grant all on public.premium_requests to service_role;

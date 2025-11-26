-- Create settings table
create table public.settings (
  id integer primary key default 1,
  auto_approve_listings boolean default false,
  premium_listing_price integer default 5000,
  premium_listing_duration integer default 30,
  max_images_per_listing integer default 10,
  max_listings_per_user integer default 50,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint single_row check (id = 1)
);

-- Add RLS policies
alter table public.settings enable row level security;

create policy "Settings are readable by all users"
  on public.settings for select
  to authenticated, anon
  using (true);

create policy "Only admins can update settings"
  on public.settings for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- Add trigger to update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.settings
  for each row
  execute procedure public.handle_updated_at();

-- Insert default settings
insert into public.settings (
  auto_approve_listings,
  premium_listing_price,
  premium_listing_duration,
  max_images_per_listing,
  max_listings_per_user
) values (
  false,
  5000,
  30,
  10,
  50
);
-- Create favorites table
create table public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, listing_id)
);

-- Enable RLS
alter table public.favorites enable row level security;

-- Policies
create policy "Users can view their own favorites"
  on public.favorites for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add favorites"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove their own favorites"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create notification on favorite
create or replace function notify_favorite()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into notifications (
    type,
    recipient_id,
    user_id,
    listing_id,
    read
  )
  select
    'favorite',
    l.seller_id,
    new.user_id,
    new.listing_id,
    false
  from listings l
  where l.id = new.listing_id
  and l.seller_id != new.user_id;

  return new;
end;
$$;

create trigger on_favorite_added
  after insert on public.favorites
  for each row
  execute function notify_favorite();
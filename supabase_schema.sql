-- Dekonvi Database Schema for Supabase
-- Generated for project: https://cnnifestkyytrjhgvtrb.supabase.co

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =========================================
-- PROFILES TABLE
-- =========================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null unique,
  avatar_url text,
  phone text,
  location text,
  role text not null default 'user' check (role in ('user', 'admin')),
  rating numeric default 0,
  total_ratings integer default 0,
  is_recommended boolean default false,
  created_at timestamptz default now(),
  last_seen timestamptz default now()
);

-- =========================================
-- LISTINGS TABLE
-- =========================================
create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  price numeric not null,
  location text not null,
  images text[] not null default '{}',
  category text not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('active', 'pending', 'rejected')),
  created_at timestamptz default now(),
  delivery_available boolean default false,
  is_premium boolean default false,
  premium_until timestamptz,
  condition text,
  contact_phone text,
  hide_phone boolean default false
);

-- =========================================
-- CONVERSATIONS TABLE
-- =========================================
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  participants uuid[] not null,
  created_at timestamptz default now(),
  last_message jsonb,
  unread_count integer default 0
);

-- =========================================
-- MESSAGES TABLE
-- =========================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  read boolean default false
);

-- =========================================
-- FAVORITES TABLE
-- =========================================
create table public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

-- =========================================
-- REPORTS TABLE
-- =========================================
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  created_at timestamptz default now()
);

-- =========================================
-- PREMIUM REQUESTS TABLE
-- =========================================
create table public.premium_requests (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  duration integer not null,
  price numeric not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- =========================================
-- ADVERTISEMENTS TABLE
-- =========================================
create table public.advertisements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  image_url text not null,
  link text,
  active boolean default true,
  order_position integer default 0,
  created_at timestamptz default now()
);

-- =========================================
-- SETTINGS TABLE (App Configuration)
-- =========================================
create table public.settings (
  id uuid default uuid_generate_v4() primary key,
  auto_approve_listings boolean default false,
  allow_listings boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insert default settings
insert into public.settings (auto_approve_listings, allow_listings) 
values (false, true);

-- =========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;
alter table public.premium_requests enable row level security;
alter table public.advertisements enable row level security;
alter table public.settings enable row level security;

-- PROFILES policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- LISTINGS policies
create policy "Listings are viewable by everyone"
  on public.listings for select
  using (true);

create policy "Users can create listings"
  on public.listings for insert
  with check (auth.uid() = seller_id);

create policy "Users can update own listings"
  on public.listings for update
  using (auth.uid() = seller_id);

create policy "Users can delete own listings"
  on public.listings for delete
  using (auth.uid() = seller_id);

-- CONVERSATIONS policies
create policy "Users can view their own conversations"
  on public.conversations for select
  using (auth.uid() = any(participants));

create policy "Users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = any(participants));

-- MESSAGES policies
create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where id = conversation_id
      and auth.uid() = any(participants)
    )
  );

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- FAVORITES policies
create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can add favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- REPORTS policies
create policy "Users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Admins can view all reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- PREMIUM REQUESTS policies
create policy "Users can view their own premium requests"
  on public.premium_requests for select
  using (auth.uid() = seller_id);

create policy "Users can create premium requests"
  on public.premium_requests for insert
  with check (auth.uid() = seller_id);

-- ADVERTISEMENTS policies
create policy "Active advertisements are viewable by everyone"
  on public.advertisements for select
  using (active = true);

-- SETTINGS policies (admin only)
create policy "Settings are viewable by everyone"
  on public.settings for select
  using (true);

create policy "Only admins can update settings"
  on public.settings for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

create index listings_seller_id_idx on public.listings(seller_id);
create index listings_category_idx on public.listings(category);
create index listings_status_idx on public.listings(status);
create index listings_created_at_idx on public.listings(created_at desc);

create index conversations_participants_idx on public.conversations using gin(participants);
create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_created_at_idx on public.messages(created_at desc);

create index favorites_user_id_idx on public.favorites(user_id);
create index favorites_listing_id_idx on public.favorites(listing_id);

-- =========================================
-- FUNCTIONS & TRIGGERS
-- =========================================

-- Function to update last_seen timestamp
create or replace function public.update_last_seen()
returns trigger as $$
begin
  update public.profiles
  set last_seen = now()
  where id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    new.email,
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================
-- STORAGE BUCKETS
-- =========================================

-- Create storage bucket for listing images
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict do nothing;

-- Storage policy for listings bucket
create policy "Anyone can view listing images"
  on storage.objects for select
  using (bucket_id = 'listings');

create policy "Authenticated users can upload listing images"
  on storage.objects for insert
  with check (bucket_id = 'listings' and auth.role() = 'authenticated');

create policy "Users can update their own listing images"
  on storage.objects for update
  using (bucket_id = 'listings' and auth.role() = 'authenticated');

create policy "Users can delete their own listing images"
  on storage.objects for delete
  using (bucket_id = 'listings' and auth.role() = 'authenticated');

-- Create storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

-- Storage policy for avatars bucket
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

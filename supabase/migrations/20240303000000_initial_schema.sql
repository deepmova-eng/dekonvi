-- Enable les extensions nécessaires
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Création des tables
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null unique,
  avatar_url text,
  phone text,
  location text,
  role text not null default 'user' check (role in ('user', 'admin')),
  rating numeric(3,2) default 0 check (rating >= 0 and rating <= 5),
  total_ratings integer default 0,
  is_recommended boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_seen timestamp with time zone default timezone('utc'::text, now())
);

create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  price numeric not null check (price >= 0),
  location text not null,
  images text[] not null,
  category text not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('active', 'pending', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  delivery_available boolean default false,
  is_premium boolean default false,
  premium_until timestamp with time zone
);

create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  participants uuid[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_message jsonb,
  unread_count integer default 0
);

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read boolean default false
);

create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.premium_requests (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  duration integer not null,
  price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.advertisements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  image_url text not null,
  link text,
  order_position integer not null default 0,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Création des index
create index listings_category_idx on public.listings(category);
create index listings_seller_id_idx on public.listings(seller_id);
create index listings_status_idx on public.listings(status);
create index listings_created_at_idx on public.listings(created_at desc);
create index listings_title_trgm_idx on public.listings using gin (title gin_trgm_ops);
create index listings_location_trgm_idx on public.listings using gin (location gin_trgm_ops);

-- Politiques de sécurité Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.premium_requests enable row level security;
alter table public.advertisements enable row level security;

-- Politiques pour profiles
create policy "Les profils sont visibles par tous"
  on public.profiles for select
  to authenticated, anon
  using (true);

create policy "Les utilisateurs peuvent modifier leur propre profil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Politiques pour listings
create policy "Les annonces sont visibles par tous"
  on public.listings for select
  to authenticated, anon
  using (true);

create policy "Les utilisateurs peuvent créer des annonces"
  on public.listings for insert
  to authenticated
  with check (seller_id = auth.uid());

create policy "Les utilisateurs peuvent modifier leurs propres annonces"
  on public.listings for update
  to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

create policy "Les utilisateurs peuvent supprimer leurs propres annonces"
  on public.listings for delete
  to authenticated
  using (seller_id = auth.uid());

-- Politiques pour conversations
create policy "Les utilisateurs peuvent voir leurs conversations"
  on public.conversations for select
  to authenticated
  using (auth.uid() = any(participants));

create policy "Les utilisateurs peuvent créer des conversations"
  on public.conversations for insert
  to authenticated
  with check (auth.uid() = any(participants));

create policy "Les participants peuvent mettre à jour leurs conversations"
  on public.conversations for update
  to authenticated
  using (auth.uid() = any(participants))
  with check (auth.uid() = any(participants));

-- Politiques pour messages
create policy "Les participants peuvent voir les messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and auth.uid() = any(c.participants)
    )
  );

create policy "Les participants peuvent envoyer des messages"
  on public.messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and auth.uid() = any(c.participants)
    )
  );

-- Politiques pour reports
create policy "Les utilisateurs peuvent créer des signalements"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "Les admins peuvent voir les signalements"
  on public.reports for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- Politiques pour premium_requests
create policy "Les utilisateurs peuvent voir leurs demandes premium"
  on public.premium_requests for select
  to authenticated
  using (seller_id = auth.uid());

create policy "Les utilisateurs peuvent créer des demandes premium"
  on public.premium_requests for insert
  to authenticated
  with check (seller_id = auth.uid());

-- Politiques pour advertisements
create policy "Les publicités sont visibles par tous"
  on public.advertisements for select
  to authenticated, anon
  using (active = true);

create policy "Les admins peuvent gérer les publicités"
  on public.advertisements for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- Fonctions et triggers
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (new.id, new.raw_user_meta_data->>'name', new.email, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.handle_listing_update()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.is_premium = true and (old.is_premium = false or old.is_premium is null) then
    new.premium_until := now() + interval '30 days';
  end if;
  return new;
end;
$$;

create trigger before_listing_update
  before update on public.listings
  for each row execute procedure public.handle_listing_update();
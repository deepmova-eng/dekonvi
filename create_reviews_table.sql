-- Create reviews table
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
  -- Removed unique constraint on (reviewer_id, listing_id) to allow multiple reviews if needed, 
  -- or we can keep it if we want to strictly limit one review per transaction.
  -- For now, let's keep it simple and allow multiple reviews but maybe we should enforce one per listing?
  -- Let's stick to the plan: unique(reviewer_id, listing_id) is good practice for e-commerce.
  , unique(reviewer_id, listing_id)
);

-- Create indexes
create index if not exists reviews_seller_id_idx on public.reviews(seller_id);
create index if not exists reviews_reviewer_id_idx on public.reviews(reviewer_id);

-- Enable RLS
alter table public.reviews enable row level security;

-- Create policies
-- Drop existing policies if they exist to avoid errors on re-run
drop policy if exists "Reviews are viewable by everyone" on public.reviews;
create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

drop policy if exists "Authenticated users can create reviews" on public.reviews;
create policy "Authenticated users can create reviews"
  on public.reviews for insert with check (auth.uid() = reviewer_id);

-- Create function to update seller rating
create or replace function public.update_seller_rating()
returns trigger as $$
begin
  update public.profiles
  set 
    rating = (select coalesce(avg(rating), 0) from public.reviews where seller_id = new.seller_id),
    total_ratings = (select count(*) from public.reviews where seller_id = new.seller_id)
  where id = new.seller_id;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger
drop trigger if exists on_review_created on public.reviews;
create trigger on_review_created
  after insert on public.reviews
  for each row execute function public.update_seller_rating();

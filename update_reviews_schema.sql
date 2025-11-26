-- Add status and proof_image_url to reviews table
alter table public.reviews 
add column if not exists status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
add column if not exists proof_image_url text;

-- Update trigger function to only count approved reviews
create or replace function public.update_seller_rating()
returns trigger as $$
begin
  update public.profiles
  set 
    rating = (select coalesce(avg(rating), 0) from public.reviews where seller_id = new.seller_id and status = 'approved'),
    total_ratings = (select count(*) from public.reviews where seller_id = new.seller_id and status = 'approved')
  where id = new.seller_id;
  return new;
end;
$$ language plpgsql security definer;

-- Create storage bucket for review proofs
insert into storage.buckets (id, name, public)
values ('review-proofs', 'review-proofs', false) -- Private bucket
on conflict (id) do nothing;

-- Storage policies for review-proofs
-- Allow authenticated users to upload proofs
create policy "Authenticated users can upload review proofs"
  on storage.objects for insert
  with check (bucket_id = 'review-proofs' and auth.role() = 'authenticated');

-- Allow admins to view all proofs
create policy "Admins can view review proofs"
  on storage.objects for select
  using (
    bucket_id = 'review-proofs' 
    and (
      auth.role() = 'authenticated' 
      and exists (
        select 1 from public.profiles 
        where id = auth.uid() 
        and role = 'admin'
      )
    )
  );

-- Allow users to view their own proofs (optional, but good for UX if we show them their pending reviews)
create policy "Users can view their own review proofs"
  on storage.objects for select
  using (
    bucket_id = 'review-proofs' 
    and auth.uid() = owner
  );

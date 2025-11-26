-- Enable RLS on listings table if not already enabled
alter table listings enable row level security;

-- Policy to allow users to SELECT their own listings (and others' public listings, usually)
-- Assuming there's already a policy for public select, but we ensure owner can select
create policy "Users can view their own listings"
on listings for select
using (auth.uid() = seller_id);

-- Policy to allow users to UPDATE their own listings
create policy "Users can update their own listings"
on listings for update
using (auth.uid() = seller_id);

-- Policy to allow users to DELETE their own listings
create policy "Users can delete their own listings"
on listings for delete
using (auth.uid() = seller_id);

-- Grant access to authenticated users
grant all on listings to authenticated;

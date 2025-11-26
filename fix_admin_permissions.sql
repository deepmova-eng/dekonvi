-- Policy to allow admins to UPDATE any listing
create policy "Admins can update any listing"
on listings for update
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Policy to allow admins to DELETE any listing
create policy "Admins can delete any listing"
on listings for delete
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Ensure admin@dekonvi.com has the admin role
update profiles
set role = 'admin'
where email = 'admin@dekonvi.com';

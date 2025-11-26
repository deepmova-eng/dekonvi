-- Function to approve a premium request and update the listing
create or replace function approve_premium_request(request_id uuid, listing_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Update request status
  update public.premium_requests
  set status = 'approved'
  where id = request_id;

  -- Update listing premium status
  update public.listings
  set 
    is_premium = true,
    premium_until = now() + interval '30 days'
  where id = listing_id;
end;
$$;
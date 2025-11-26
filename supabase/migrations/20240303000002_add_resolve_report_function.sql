-- Function to resolve a report and delete the associated listing
create or replace function resolve_report(report_id uuid, listing_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Update report status
  update public.reports
  set status = 'resolved'
  where id = report_id;

  -- Delete the listing
  delete from public.listings
  where id = listing_id;
end;
$$;
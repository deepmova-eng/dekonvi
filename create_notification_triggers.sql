-- Trigger for Listing Approval
create or replace function public.handle_listing_approved_notification()
returns trigger as $$
begin
  if (old.status != 'active' and new.status = 'active') then
    insert into public.notifications (user_id, type, title, content, link)
    values (
      new.seller_id,
      'system',
      'Article approuvé !',
      'Votre article "' || new.title || '" a été validé et est maintenant en ligne.',
      '/product/' || new.id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_listing_approved on public.listings;
create trigger on_listing_approved
  after update on public.listings
  for each row execute function public.handle_listing_approved_notification();


-- Trigger for Premium Request Approval (Boost)
create or replace function public.handle_premium_approved_notification()
returns trigger as $$
begin
  if (old.status != 'approved' and new.status = 'approved') then
    insert into public.notifications (user_id, type, title, content, link)
    values (
      new.seller_id,
      'premium',
      'Boost validé ! 🚀',
      'Votre demande de mise en avant pour l''article a été validée.',
      '/product/' || new.listing_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_premium_approved on public.premium_requests;
create trigger on_premium_approved
  after update on public.premium_requests
  for each row execute function public.handle_premium_approved_notification();

-- Function to get all users (for admin only)
-- accessing auth.users requires security definer
drop function if exists public.get_users_admin();

create or replace function public.get_users_admin()
returns table (
  id uuid,
  email varchar,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
as $$
begin
  -- Check if the requesting user is an admin
  if not exists (
    select 1 from public.profiles
    where public.profiles.id = auth.uid()
    and public.profiles.role = 'admin'
  ) then
    raise exception 'Access denied: Admin only';
  end if;

  return query
  select
    au.id,
    au.email::varchar,
    au.email_confirmed_at,
    au.last_sign_in_at
  from auth.users au;
end;
$$;

-- Function to confirm a user (for admin only)
create or replace function public.confirm_user_admin(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if the requesting user is an admin
  if not exists (
    select 1 from public.profiles
    where public.profiles.id = auth.uid()
    and public.profiles.role = 'admin'
  ) then
    raise exception 'Access denied: Admin only';
  end if;

  update auth.users
  set email_confirmed_at = now(),
      updated_at = now()
  where id = target_user_id;
  
  if not found then
    raise exception 'User not found or update failed';
  end if;
end;
$$;

-- Grant execute permissions to authenticated users (RLS inside function handles security)
grant execute on function public.get_users_admin() to authenticated;
grant execute on function public.confirm_user_admin(uuid) to authenticated;

-- Function to delete a user (for admin only)
create or replace function public.delete_user_admin(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if the requesting user is an admin
  if not exists (
    select 1 from public.profiles
    where public.profiles.id = auth.uid()
    and public.profiles.role = 'admin'
  ) then
    raise exception 'Access denied: Admin only';
  end if;

  -- Delete the user from auth.users
  -- This should cascade to public.profiles and other related tables if foreign keys are set up correctly with ON DELETE CASCADE
  delete from auth.users
  where id = target_user_id;
  
  if not found then
    raise exception 'User not found or deletion failed';
  end if;
end;
$$;

grant execute on function public.delete_user_admin(uuid) to authenticated;

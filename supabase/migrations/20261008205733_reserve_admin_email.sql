alter table public.melvey_settings add column if not exists admin_owner_email text;
create or replace function melvey_private.is_reserved_owner(p_owner uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from auth.users u join public.melvey_settings s on s.id='main'
    where u.id=p_owner and lower(u.email)=lower(s.admin_owner_email) and u.email_confirmed_at is not null and u.deleted_at is null);
$$;
revoke execute on function melvey_private.is_reserved_owner(uuid) from public,anon,authenticated;
grant usage on schema melvey_private to service_role;
grant execute on function melvey_private.is_reserved_owner(uuid) to service_role;
create or replace function public.melvey_enroll_owner(p_owner uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare assigned uuid; required_email text;
begin
  select admin_owner_email into required_email from public.melvey_settings where id='main' for update;
  if required_email is not null and not melvey_private.is_reserved_owner(p_owner) then return null; end if;
  update public.melvey_settings set admin_owner_id=p_owner where id='main' and (admin_owner_id is null or admin_owner_id=p_owner) returning admin_owner_id into assigned;
  return assigned;
end $$;
revoke execute on function public.melvey_enroll_owner(uuid) from public,anon,authenticated;
grant execute on function public.melvey_enroll_owner(uuid) to service_role;

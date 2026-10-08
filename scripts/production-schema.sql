-- Apply once to the existing melveybeats Supabase project before publishing v0.2.
-- No seed beats. Existing media files and Stripe download metadata are preserved.
begin;
create schema if not exists melvey_private;
revoke all on schema melvey_private from public, anon, authenticated;
create table if not exists melvey_private.archived_listings (
  id uuid primary key, snapshot jsonb not null, archived_at timestamptz not null default now()
);
alter table melvey_private.archived_listings enable row level security;
lock table public.beats in share row exclusive mode;
insert into melvey_private.archived_listings(id,snapshot)
select id,to_jsonb(beats) from public.beats on conflict(id) do nothing;
delete from public.beats where id in (select id from melvey_private.archived_listings);
revoke insert,update,delete on public.beats from anon,authenticated;
alter table public.free_beat enable row level security;
revoke insert,update,delete on public.free_beat from anon,authenticated;
create table if not exists public.melvey_profiles (
  owner_id uuid primary key references auth.users(id), email text not null, name text not null check(length(name) between 2 and 60), created_at timestamptz not null default now()
);
create table if not exists public.melvey_media (
  key text primary key, owner_id uuid not null references auth.users(id), kind text not null check(kind in ('preview','master','art')), mime text not null, name text not null,
  size integer not null check(size>0 and size<=41943040), verified boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.melvey_catalog (
  id uuid primary key default gen_random_uuid(), title text not null, genre text not null check(genre in ('Melodic','Trap','R&B','Dark')),
  bpm integer not null check(bpm between 40 and 240), musical_key text not null, tags text[] not null default '{}',
  price integer not null check(price between 100 and 100000), exclusive_price integer not null check(exclusive_price>=price and exclusive_price<=100000),
  duration double precision not null check(duration>0 and duration<=1800), preview_key text not null references public.melvey_media(key),
  download_key text not null references public.melvey_media(key), artwork_key text references public.melvey_media(key),
  archived boolean not null default false, sold boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.melvey_settings (id text primary key,featured_id uuid references public.melvey_catalog(id),admin_owner_id uuid references auth.users(id));
insert into public.melvey_settings(id) values('main') on conflict do nothing;
create table if not exists public.melvey_orders (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), email text not null, items jsonb not null,
  total integer not null check(total>0), idempotency_key uuid not null, status text not null default 'pending' check(status in ('pending','paid','cancelled')),
  stripe_session_id text unique, mode text not null default 'live' check(mode in ('live','test')), created_at timestamptz not null default now(), paid_at timestamptz,
  unique(owner_id,idempotency_key)
);
create index if not exists melvey_orders_owner on public.melvey_orders(owner_id,created_at desc);
create index if not exists melvey_orders_pending on public.melvey_orders(created_at) where status='pending';
create table if not exists public.melvey_holds (
  beat_id uuid not null references public.melvey_catalog(id), order_id uuid not null references public.melvey_orders(id), license text not null check(license in ('standard','exclusive')),
  primary key(beat_id,order_id)
);
create index if not exists melvey_holds_order on public.melvey_holds(order_id);
alter table public.melvey_profiles enable row level security;
alter table public.melvey_media enable row level security;
alter table public.melvey_catalog enable row level security;
alter table public.melvey_settings enable row level security;
alter table public.melvey_orders enable row level security;
alter table public.melvey_holds enable row level security;
revoke all on public.melvey_profiles,public.melvey_media,public.melvey_catalog,public.melvey_settings,public.melvey_orders,public.melvey_holds from public,anon,authenticated;
grant all on public.melvey_profiles,public.melvey_media,public.melvey_catalog,public.melvey_settings,public.melvey_orders,public.melvey_holds to service_role;

-- These functions are callable only by the server service role, and run as invoker.
create or replace function public.melvey_reserve_order(p_owner uuid,p_email text,p_key uuid,p_items jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.melvey_orders; b public.melvey_catalog; item jsonb; snapshot jsonb='[]'; amount integer=0; n integer=0;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text||p_key::text,0));
  select * into o from public.melvey_orders where owner_id=p_owner and idempotency_key=p_key;
  if found then return to_jsonb(o); end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Invalid cart'; end if;
  if (select count(distinct v->>'beatId') from jsonb_array_elements(p_items)v)<>jsonb_array_length(p_items) then raise exception 'Duplicate cart items'; end if;
  for b in select * from public.melvey_catalog where id in (select (v->>'beatId')::uuid from jsonb_array_elements(p_items)v) order by id for update loop
    n=n+1; select v into item from jsonb_array_elements(p_items)v where v->>'beatId'=b.id::text;
    if b.archived or b.sold or item->>'license' not in ('standard','exclusive') then raise exception 'Beat unavailable'; end if;
    if exists(select 1 from public.melvey_holds where beat_id=b.id and (license='exclusive' or item->>'license'='exclusive')) then raise exception 'Beat is reserved by another checkout'; end if;
    amount=amount+case when item->>'license'='exclusive' then b.exclusive_price else b.price end;
    snapshot=snapshot||jsonb_build_array(jsonb_build_object('beatId',b.id,'title',b.title,'license',item->>'license','price',case when item->>'license'='exclusive' then b.exclusive_price else b.price end,
      'artworkUrl',case when b.artwork_key is not null then '/api/media/'||b.artwork_key else '/art/featured.svg' end,'previewUrl','/api/media/'||b.preview_key,
      'downloadUrl','/api/media/'||b.download_key||'?download=1','downloadKey',b.download_key,'bpm',b.bpm,'key',b.musical_key,'duration',b.duration,'genre',b.genre));
  end loop;
  if n<>jsonb_array_length(p_items) then raise exception 'Beat unavailable'; end if;
  insert into public.melvey_orders(owner_id,email,items,total,idempotency_key) values(p_owner,p_email,snapshot,amount,p_key) returning * into o;
  insert into public.melvey_holds(beat_id,order_id,license) select (v->>'beatId')::uuid,o.id,v->>'license' from jsonb_array_elements(p_items)v;
  return to_jsonb(o);
end $$;

create or replace function public.melvey_complete_order(p_order uuid,p_session text,p_mode text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.melvey_orders;
begin
  select * into o from public.melvey_orders where id=p_order for update;
  if not found or o.stripe_session_id is distinct from p_session then raise exception 'Order mismatch'; end if;
  if o.status='paid' then return to_jsonb(o); end if;
  if o.status<>'pending' then raise exception 'Order unavailable'; end if;
  perform 1 from public.melvey_catalog where id in(select beat_id from public.melvey_holds where order_id=o.id) order by id for update;
  update public.melvey_catalog set sold=true where id in(select beat_id from public.melvey_holds where order_id=o.id and license='exclusive');
  update public.melvey_orders set status='paid',paid_at=now(),mode=p_mode where id=o.id returning * into o;
  delete from public.melvey_holds where order_id=o.id;
  return to_jsonb(o);
end $$;
create or replace function public.melvey_cancel_order(p_order uuid,p_session text)
returns void language plpgsql security invoker set search_path='' as $$
begin
  perform 1 from public.melvey_orders where id=p_order and status='pending' and stripe_session_id is not distinct from p_session for update;
  if found then
    update public.melvey_orders set status='cancelled' where id=p_order;
    delete from public.melvey_holds where order_id=p_order;
  end if;
end $$;
revoke execute on function public.melvey_reserve_order(uuid,text,uuid,jsonb), public.melvey_complete_order(uuid,text,text), public.melvey_cancel_order(uuid,text) from public,anon,authenticated;
grant execute on function public.melvey_reserve_order(uuid,text,uuid,jsonb), public.melvey_complete_order(uuid,text,text), public.melvey_cancel_order(uuid,text) to service_role;
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

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('melvey-store','melvey-store',false,41943040,array['audio/mpeg','audio/wav','audio/x-wav','audio/ogg','image/png','image/jpeg','image/webp'])
on conflict(id) do nothing;
commit;

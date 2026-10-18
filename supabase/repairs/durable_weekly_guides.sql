-- Server-only queue. Existing trial limits, AI pricing and photo ownership stay authoritative.
create table public.weekly_guides (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 request_key text not null unique,
 look_ids text[] not null check(cardinality(look_ids)=7),
 photo_path text not null, photo_type text not null,
 results jsonb not null default '{}',
 status text not null default 'queued' check(status in ('queued','running','ready','attention','expired')),
 attempts integer not null default 0,
 lease_token uuid, lease_until timestamptz,
 not_before timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '24 hours',
 last_error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index weekly_guides_one_active_user on public.weekly_guides(user_id) where status in ('queued','running');
create index weekly_guides_ready_queue on public.weekly_guides(not_before) where status in ('queued','running');
create index weekly_guides_user on public.weekly_guides(user_id,created_at desc);
alter table public.weekly_guides enable row level security;
revoke all on public.weekly_guides from public,anon,authenticated;
grant select,insert,update,delete on public.weekly_guides to service_role;
create function public.claim_weekly_guides(p_user uuid default null,p_limit integer default 4)
returns setof public.weekly_guides language sql security invoker set search_path='' as $$
 update public.weekly_guides g set status='running',lease_token=gen_random_uuid(),lease_until=now()+interval '4 minutes',updated_at=now()
 where g.id in (
  select q.id from public.weekly_guides q
  where q.status in ('queued','running') and q.not_before<=now()
  and (q.lease_until is null or q.lease_until<now())
  and (p_user is null or q.user_id=p_user)
  order by q.not_before,q.created_at for update skip locked limit greatest(1,least(p_limit,4))
 ) returning g.*;
$$;
revoke all on function public.claim_weekly_guides(uuid,integer) from public,anon,authenticated;
grant execute on function public.claim_weekly_guides(uuid,integer) to service_role;

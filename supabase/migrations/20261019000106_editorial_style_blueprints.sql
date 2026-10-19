create table public.style_blueprints (
 user_id uuid primary key references auth.users(id) on delete cascade,
 preferences jsonb not null default '{}', document jsonb not null,
 context_key text not null, updated_at timestamptz not null default now()
);
alter table public.style_blueprints enable row level security;
revoke all on public.style_blueprints from public,anon,authenticated;
grant select,insert,update,delete on public.style_blueprints to service_role;

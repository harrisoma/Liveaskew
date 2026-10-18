alter table public.tryon_renders add column if not exists status text not null default 'ready' check(status in ('running','ready','failed','uncertain'));
alter table public.tryon_renders add column if not exists operation_id uuid;
alter table public.tryon_renders add column if not exists error_code text;
alter table public.tryon_renders add column if not exists updated_at timestamptz not null default now();
revoke insert,update,delete on public.tryon_renders from anon,authenticated;
grant select on public.tryon_renders to authenticated;

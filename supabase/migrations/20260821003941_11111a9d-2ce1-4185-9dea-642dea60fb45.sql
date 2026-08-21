create table if not exists public.music_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text,
  link_url text,
  reward numeric not null default 0,
  verify text not null default 'link',
  chat_id text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.music_tasks to anon, authenticated;
grant all on public.music_tasks to service_role;
alter table public.music_tasks enable row level security;
create policy "Active tasks are public" on public.music_tasks for select to anon, authenticated using (is_active);

create table if not exists public.music_task_completions (
  id uuid primary key default gen_random_uuid(),
  player_key text not null,
  task_id uuid not null references public.music_tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (player_key, task_id)
);
grant all on public.music_task_completions to service_role;
alter table public.music_task_completions enable row level security;

create table if not exists public.music_task_requests (
  id uuid primary key default gen_random_uuid(),
  player_key text not null,
  tg_username text,
  amount_gram numeric not null default 10,
  status text not null default 'paid',
  tx_hash text,
  created_at timestamptz not null default now()
);
grant all on public.music_task_requests to service_role;
alter table public.music_task_requests enable row level security;

create table if not exists public.music_task_drafts (
  telegram_id bigint primary key,
  draft jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant all on public.music_task_drafts to service_role;
alter table public.music_task_drafts enable row level security;

insert into public.music_tasks (title, image_url, link_url, reward, verify, chat_id, sort_order)
select 'Join our community', null, 'https://t.me/muscox', 2500, 'telegram_member', '@muscox', -100
where not exists (select 1 from public.music_tasks where link_url = 'https://t.me/muscox');
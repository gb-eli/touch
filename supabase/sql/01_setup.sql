-- TV TOUCH AGV 1.2 — executar manualmente no SQL Editor de um projeto Supabase dedicado.
-- Não modifica nem utiliza tabelas de outros sistemas.
create table if not exists public.tvt_sessions (
  id uuid primary key,
  station text not null check (station in ('TV TOUCH 01','TV TOUCH 02','TV TOUCH 03')),
  area text not null check (area in ('comum','tecnica','interdisciplinar')),
  discipline text not null check (length(discipline) between 2 and 80),
  os text not null default 'Outro' check (length(os) <= 40),
  browser text not null default 'Outro' check (length(browser) <= 40),
  screen_width integer check (screen_width between 0 and 32767),
  screen_height integer check (screen_height between 0 and 32767),
  touch_limit integer check (touch_limit between 0 and 100),
  webgl boolean,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists tvt_sessions_day_station on public.tvt_sessions (started_at desc,station);
create index if not exists tvt_sessions_area_disc on public.tvt_sessions (area,discipline,started_at desc);

create table if not exists public.tvt_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.tvt_sessions(id) on delete cascade,
  event_type text not null check (event_type in ('tool_open','resource_open','page_load')),
  item_id text not null check (item_id ~ '^[a-z0-9_-]{2,50}$'),
  occurred_at timestamptz not null default now()
);
create index if not exists tvt_events_session_idx on public.tvt_events(session_id,occurred_at desc);
create index if not exists tvt_events_item_idx on public.tvt_events(event_type,item_id,occurred_at desc);

create table if not exists public.tvt_metrics (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.tvt_sessions(id) on delete cascade,
  metric_type text not null check (metric_type in ('http_latency_ms','fps','touch_peak','page_load_ms')),
  metric_value numeric(10,2) check (metric_value between 0 and 120000),
  attempts smallint not null default 1 check (attempts between 1 and 10),
  failures smallint not null default 0 check (failures between 0 and attempts),
  measured_at timestamptz not null default now()
);
create index if not exists tvt_metrics_type_time on public.tvt_metrics(metric_type,measured_at desc);

create table if not exists public.tvt_rate_limits (
  hash text primary key check (hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null default now(),
  hits integer not null default 1
);

-- Limite atômico por janela de 1 minuto. A chave é um HMAC temporário,
-- gerado no servidor, sem persistir o endereço IP bruto.
create or replace function public.tvt_check_rate(p_hash text, p_max_hits integer)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with counter as (
    insert into public.tvt_rate_limits (hash,window_started_at,hits)
    values (p_hash,now(),1)
    on conflict (hash) do update set
      hits = case when public.tvt_rate_limits.window_started_at < now()-interval '1 minute'
        then 1 else public.tvt_rate_limits.hits+1 end,
      window_started_at = case when public.tvt_rate_limits.window_started_at < now()-interval '1 minute'
        then now() else public.tvt_rate_limits.window_started_at end
    returning hits
  )
  select (hits <= least(greatest(p_max_hits,1),120)) from counter;
$$;

-- Mesmo que o Data API exponha automaticamente o schema public, nenhuma
-- tabela de telemetria pode ser lida ou escrita por visitantes anônimos.
alter table public.tvt_sessions enable row level security;
alter table public.tvt_events enable row level security;
alter table public.tvt_metrics enable row level security;
alter table public.tvt_rate_limits enable row level security;
revoke all on table public.tvt_sessions, public.tvt_events, public.tvt_metrics, public.tvt_rate_limits from public, anon, authenticated;
grant select, insert, update on table public.tvt_sessions, public.tvt_events, public.tvt_metrics, public.tvt_rate_limits to service_role;
grant usage, select on sequence public.tvt_events_id_seq, public.tvt_metrics_id_seq to service_role;
revoke all on function public.tvt_check_rate(text,integer) from public, anon, authenticated;
grant execute on function public.tvt_check_rate(text,integer) to service_role;

-- Rotina manual de retenção (executar mensalmente ou automatizar com cron autorizado):
-- delete from public.tvt_events where occurred_at < now() - interval '90 days';
-- delete from public.tvt_metrics where measured_at < now() - interval '90 days';
-- delete from public.tvt_sessions where started_at < now() - interval '90 days';
-- delete from public.tvt_rate_limits where window_started_at < now() - interval '2 days';

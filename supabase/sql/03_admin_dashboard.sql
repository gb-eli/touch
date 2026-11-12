-- TV TOUCH AGV v1.3 — administração protegida.
-- PRÉ-REQUISITO: executar 01_setup.sql antes deste script.
-- Execute no SQL Editor com acesso administrativo. Não rode com chave pública.

create table if not exists public.tvt_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.tvt_admins enable row level security;
revoke all on table public.tvt_admins from public, anon, authenticated;
grant select on table public.tvt_admins to authenticated;

drop policy if exists tvt_admin_self on public.tvt_admins;
create policy tvt_admin_self on public.tvt_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Os visitantes continuam sem qualquer permissão de leitura dos eventos.
-- Apenas contas que constam na tabela tvt_admins podem ler telemetria.
grant select on public.tvt_sessions, public.tvt_events, public.tvt_metrics to authenticated;

drop policy if exists tvt_admin_sessions_read on public.tvt_sessions;
create policy tvt_admin_sessions_read on public.tvt_sessions
  for select to authenticated
  using (exists (select 1 from public.tvt_admins a where a.user_id=(select auth.uid())));

drop policy if exists tvt_admin_events_read on public.tvt_events;
create policy tvt_admin_events_read on public.tvt_events
  for select to authenticated
  using (exists (select 1 from public.tvt_admins a where a.user_id=(select auth.uid())));

drop policy if exists tvt_admin_metrics_read on public.tvt_metrics;
create policy tvt_admin_metrics_read on public.tvt_metrics
  for select to authenticated
  using (exists (select 1 from public.tvt_admins a where a.user_id=(select auth.uid())));

create index if not exists tvt_metrics_session_time on public.tvt_metrics(session_id, measured_at desc);

-- A RPC agrega registros do servidor, evitando o limite de paginação do PostgREST
-- e impedindo o envio de sessões individuais ao painel de gestão.
create or replace function public.tvt_admin_dashboard(
  p_days integer default 30,
  p_station text default null
) returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  result jsonb;
begin
  if p_days is null or p_days not in (7,30,90) then
    raise exception 'Período inválido' using errcode='22023';
  end if;
  if p_station is not null and p_station not in ('TV TOUCH 01','TV TOUCH 02','TV TOUCH 03') then
    raise exception 'Painel inválido' using errcode='22023';
  end if;
  if (select auth.uid()) is null or not exists (
    select 1 from public.tvt_admins a where a.user_id = (select auth.uid())
  ) then
    raise exception 'Acesso restrito ao administrador' using errcode='42501';
  end if;

  with
  s as materialized (
    select id,station,area,discipline,started_at,last_seen_at
    from public.tvt_sessions
    where started_at >= (((now() at time zone 'America/Sao_Paulo')::date - (p_days-1))::timestamp at time zone 'America/Sao_Paulo')
      and (p_station is null or station = p_station)
  ),
  e as materialized (
    select ev.session_id,ev.event_type,ev.item_id,ev.occurred_at
    from public.tvt_events ev inner join s on s.id=ev.session_id
    where ev.occurred_at >= (((now() at time zone 'America/Sao_Paulo')::date - (p_days-1))::timestamp at time zone 'America/Sao_Paulo')
  ),
  m as materialized (
    select mt.session_id,mt.metric_type,mt.metric_value,mt.attempts,mt.failures,mt.measured_at,s.station
    from public.tvt_metrics mt inner join s on s.id=mt.session_id
    where mt.measured_at >= (((now() at time zone 'America/Sao_Paulo')::date - (p_days-1))::timestamp at time zone 'America/Sao_Paulo')
  )
  select jsonb_build_object(
    'generatedAt',now(),
    'days',p_days,
    'stationFilter',p_station,
    'summary',(
      select jsonb_build_object(
        'sessions',count(*),
        'activePanels',count(distinct station),
        'averageMinutes',coalesce(round(avg(least(greatest(extract(epoch from (last_seen_at-started_at)),0),7200)/60)::numeric,1),0)
      ) from s
    ) || (
      select jsonb_build_object(
        'toolOpens',count(*) filter (where event_type in ('tool_open','resource_open'))
      ) from e
    ) || (
      select jsonb_build_object(
        'httpLatencyMs',round(avg(metric_value) filter (where metric_type='http_latency_ms'),1),
        'httpAttempts',coalesce(sum(attempts) filter (where metric_type='http_latency_ms'),0),
        'httpFailures',coalesce(sum(failures) filter (where metric_type='http_latency_ms'),0),
        'averageFps',round(avg(metric_value) filter (where metric_type='fps'),1),
        'touchPeak',max(metric_value) filter (where metric_type='touch_peak')
      ) from m
    ),
    'daily',(
      select coalesce(jsonb_agg(jsonb_build_object('date',d,'sessions',n) order by d),'[]'::jsonb)
      from (
        select to_char(started_at at time zone 'America/Sao_Paulo','YYYY-MM-DD') as d,
          count(*) as n from s group by 1
      ) t
    ),
    'stations',(
      select coalesce(jsonb_agg(jsonb_build_object('name',station,'sessions',n,'minutes',mins) order by station),'[]'::jsonb)
      from (
        select station,count(*) n,
          round(avg(least(greatest(extract(epoch from (last_seen_at-started_at)),0),7200)/60)::numeric,1) mins
        from s group by station
      ) t
    ),
    'disciplines',(
      select coalesce(jsonb_agg(jsonb_build_object('name',discipline,'area',area,'sessions',n) order by n desc,discipline),'[]'::jsonb)
      from (select discipline,area,count(*) n from s group by discipline,area) t
    ),
    'areas',(
      select coalesce(jsonb_agg(jsonb_build_object('name',area,'sessions',n) order by n desc),'[]'::jsonb)
      from (select area,count(*) n from s group by area) t
    ),
    'tools',(
      select coalesce(jsonb_agg(jsonb_build_object('name',item_id,'event',event_type,'opens',n,'uniqueSessions',distinct_sessions) order by n desc,item_id),'[]'::jsonb)
      from (
        select item_id,event_type,count(*) n,count(distinct session_id) distinct_sessions
        from e where event_type in ('tool_open','resource_open')
        group by item_id,event_type
      ) t
    ),
    'network',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'name',station,'latencyMs',latency,'attempts',attempts,'failures',failures,
        'fps',fps,'touchPeak',touch_peak
      ) order by station),'[]'::jsonb)
      from (
        select station,
          round(avg(metric_value) filter (where metric_type='http_latency_ms'),1) latency,
          coalesce(sum(attempts) filter (where metric_type='http_latency_ms'),0) attempts,
          coalesce(sum(failures) filter (where metric_type='http_latency_ms'),0) failures,
          round(avg(metric_value) filter (where metric_type='fps'),1) fps,
          max(metric_value) filter (where metric_type='touch_peak') touch_peak
        from m group by station
      ) t
    )
  ) into result;
  return result;
end;
$$;

revoke all on function public.tvt_admin_dashboard(integer,text) from public, anon, authenticated;
grant execute on function public.tvt_admin_dashboard(integer,text) to authenticated;

-- PROVISIONAR ADMIN: 1) crie uma conta no Authentication > Users; 2) execute
-- insert into public.tvt_admins (user_id)
-- select id from auth.users where email='SEU-EMAIL-INSTITUCIONAL@EXEMPLO.COM';
-- Verifique que foi adicionada exatamente 1 conta antes de utilizar o painel.
-- Nunca crie ou publique senhas em SQL, JavaScript, GitHub ou capturas de tela.

-- Executar no Supabase SQL Editor com acesso administrativo.
-- Total de sessões por dia, fuso de Paranaguá.
select (started_at at time zone 'America/Sao_Paulo')::date as dia,
       count(*) as sessoes, count(distinct station) as paineis_utilizados
from public.tvt_sessions
where started_at >= now()-interval '30 days'
group by 1 order by 1 desc;

-- Disciplinas com mais aulas registradas.
select area,discipline,count(*) as aulas,
       count(distinct station) as paineis
from public.tvt_sessions
where started_at >= now()-interval '30 days'
group by area,discipline order by aulas desc,discipline;

-- Aberturas de ferramentas e recursos (não significa tempo de uso no site externo).
select e.event_type,e.item_id,count(*) as aberturas,
       count(distinct e.session_id) as sessoes_distintas
from public.tvt_events e
where e.occurred_at >= now()-interval '30 days'
  and e.event_type in ('tool_open','resource_open')
group by e.event_type,e.item_id order by aberturas desc;

-- Uso diário por painel.
select (started_at at time zone 'America/Sao_Paulo')::date as dia,
       station,count(*) as sessoes
from public.tvt_sessions
where started_at >= now()-interval '14 days'
group by 1,2 order by dia desc,station;

-- Latência HTTP média, requisições com falha e amostras utilizadas.
select s.station,
       round(avg(m.metric_value),1) as media_ms,
       sum(m.attempts) as tentativas_http,
       sum(m.failures) as falhas_http,
       round(100.0*sum(m.failures)/nullif(sum(m.attempts),0),1) as percentual_falhas
from public.tvt_metrics m
join public.tvt_sessions s on s.id=m.session_id
where m.metric_type='http_latency_ms'
  and m.measured_at >= now()-interval '7 days'
group by s.station order by s.station;

-- Máximo toque prático e FPS médio por painel (somente quando o teste é executado).
select s.station,
       max(m.metric_value) filter(where m.metric_type='touch_peak') as pico_toques,
       round(avg(m.metric_value) filter(where m.metric_type='fps'),1) as fps_medio
from public.tvt_metrics m
join public.tvt_sessions s on s.id=m.session_id
where m.measured_at >= now()-interval '30 days'
group by s.station order by s.station;

-- Estimativa de duração, limitada a no máximo 120 minutos por sessão.
-- Uma aba esquecida aberta não pode contar indefinidamente como aula ativa.
select station,
       round(avg(least(extract(epoch from (last_seen_at-started_at)),7200))/60,1) as minutos_medios_estimados
from public.tvt_sessions
where started_at >= now()-interval '30 days'
group by station order by station;

-- Execute manualmente no SQL Editor APÓS 03_admin_dashboard.sql.
select relname, relrowsecurity
from pg_class
where relname in ('tvt_sessions','tvt_events','tvt_metrics','tvt_rate_limits','tvt_admins')
order by relname;

select
  has_table_privilege('anon','public.tvt_sessions','select') as anon_sessions_select,
  has_table_privilege('anon','public.tvt_admins','select') as anon_admins_select,
  has_table_privilege('authenticated','public.tvt_events','insert') as authenticated_events_insert,
  has_table_privilege('authenticated','public.tvt_sessions','select') as authenticated_sessions_select_grant;

select (select count(*) from public.tvt_admins) as total_admins,
       (select count(*) from public.tvt_sessions) as total_sessoes;

-- Com RLS, a concessão authenticated_sessions_select_grant=true não
-- significa que qualquer usuário pode ler: a política restringe a tvt_admins.
-- Para validar autorização, execute a RPC no navegador como conta admin;
-- uma conta Auth fora da lista tvt_admins deve receber erro 42501.

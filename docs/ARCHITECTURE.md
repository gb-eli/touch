# TV TOUCH | Arquitetura v1.4

## Fronteiras

- `public/index.html`: portal de aula sem login; conteúdo estático, ferramentas e diagnóstico. Deve funcionar com Supabase desativado.
- `public/admin.html`: dashboard e gestão; exige **Supabase Auth** e cadastro no `tvt_admins`.
- `public/js/governance.js`: lê status de recursos e perfis de gesto (RLS somente leitura anônima). Configuração remota **não é bloqueio de segurança** para recursos externos.
- `public/js/admin-controls.js`: edita status e perfis via client autenticado; RLS valida pertença a `tvt_admins`.
- `supabase/sql/01_setup.sql`: telemetria isolada do público, inserção somente por Edge Function.
- `supabase/sql/03_admin_dashboard.sql`: dashboard agregado protegido, sem dados de alunos.
- `supabase/sql/05_governance.sql`: configuração pública legível e gravável somente por administradores.
- `.github/workflows/pages.yml`: publica a pasta `public/` após push na `main`.

## Fluxos de segurança

Portal → REST Supabase: leitura de indicadores de disponibilidade e perfil do equipamento (sem tokens privados). Portal → Edge Function: telemetria opcional de eventos sem identificar alunos. Admin → Supabase Auth → RLS: leitura de dashboards e edição de políticas.

**Nunca** inserir chave `service_role`, secret key, senha de rede ou dado de aluno em arquivos publicados. O navegador não é fonte confiável de autorização. Um bloqueio de botão é apenas controle pedagógico de visibilidade; links de terceiros permanecem acessíveis fora do portal.

## Calibração

Aplicam-se ao módulo de gestos web: multiplicador de rotação 3D, espessura relativa do pincel, distância mínima para iniciar arrasto. Não calibram o firmware, o digitalizador touch, pressão de caneta, acelerômetro nem sensores do Android.

## Modo offline

Atividades locais carregadas previamente podem funcionar offline. O sistema guarda por até 24 horas a última política obtida; a ausência de política não equivale a permissão de acesso a funções administrativas. Admin nunca tem dados no cache de serviço.

## Dados

Registros técnicos por sessão, área e disciplina sem nomes de estudantes; dashboards exibem agregados. Testes de latência HTTP não são ping ICMP ou perda de pacotes. Recomenda-se retenção limitada e consentimento institucional antes de ativar métricas.

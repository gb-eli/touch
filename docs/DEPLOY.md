# TV TOUCH | Implantação

1. Criar um projeto Supabase **dedicado** ao TV TOUCH. Não usar banco do AGV+, IBC ou outros produtos.
2. No SQL Editor, executar nesta ordem `supabase/sql/01_setup.sql`, `03_admin_dashboard.sql` e `05_governance.sql`. `02_relatorios.sql` e `04_validacao_admin.sql` são opcionais.
3. Implantar Edge Function `tv-touch-telemetry` e configurar variáveis secretas exigidas no seu README (o token público nunca deve ser usado como segredo).
4. Em Supabase Auth, desabilitar signup aberto para o admin, criar usuário administrador e inserir seu `user_id` em `public.tvt_admins` via console administrativo.
5. Editar `public/js/telemetria-config.js` com `supabaseUrl` e `publishableKey` somente; nunca inserir secret key.
6. Configurar `Settings → Pages → Build and deployment → Source = GitHub Actions`, caso o plano do repositório permita.
7. Validar primeiro branch de homologação/PR; após aprovação mesclar na `main`. A action publica somente conteúdo de `public/`.
8. Confirmar o endereço de Pages em `Settings → Pages`, e testar em TV TOUCH 01, 02 e 03: desenhos, multitoque, vídeo 360°, bloqueio remoto, rotação e dashboard.

## Critérios de GO

- [ ] `index.html` funciona mesmo quando Supabase falha.
- [ ] `admin.html` não lê ou altera dados sem usuário Auth autorizado.
- [ ] usuário anônimo não pode escrever configurações, nem ler telemetria.
- [ ] liberar/bloquear uma ferramenta reflete na TV após recarregar/voltar à aba.
- [ ] perfis de gesto são aplicados por TV sem manipular hardware.
- [ ] nenhuma chave secreta está no GitHub Pages, banco separado e sem dados de estudantes.
- [ ] GitHub Pages responde HTTP 200, workflow concluído e testes no Android 14 documentados.

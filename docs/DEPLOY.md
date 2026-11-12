# TV TOUCH | Implantação e atualização sem workflow personalizado

## Publicação do site

1. Código-fonte e backend ficam na branch `main`.
2. Branch `gh-pages` contém somente o **conteúdo** de `main/public/` na raiz (incluindo `.nojekyll`).
3. No GitHub, abrir **Settings → Pages → Build and deployment**.
4. Selecionar **Deploy from a branch**, **gh-pages**, **/(root)**, **Save**.
5. Conferir `https://gb-eli.github.io/touch/` e `https://gb-eli.github.io/touch/admin.html`.
6. Não reativar `.github/workflows/pages.yml` se o objetivo é evitar runners personalizados.
7. Quando `main/public/` mudar, revisar e atualizar a branch `gh-pages` manualmente; fazer push nela para publicar. **Push apenas na main não atualiza o site.**

**Observação de cobrança:** GitHub Pages usa um workflow de implantação *gerenciado pelo GitHub* mesmo com publicação pela branch. Em repositório privado, consulte o consumo do plano. Esse método evita o workflow personalizado, mas não garante zero minutos. Para realmente não executar GitHub Actions, hospedar em provedor externo, por exemplo Cloudflare Pages.

## Backend Supabase (ainda não ativado)

1. Criar projeto Supabase **dedicado** ao TV TOUCH. Não usar AGV+, IBC ou outro banco.
2. No SQL Editor executar, na ordem, `supabase/sql/01_setup.sql`, `03_admin_dashboard.sql` e `05_governance.sql`; `02_relatorios.sql` e `04_validacao_admin.sql` são consultas auxiliares.
3. Implantar Edge Function `tv-touch-telemetry` e configurar as variáveis secretas exclusivamente no backend.
4. Em Supabase Auth, restringir cadastro administrativo; criar usuário autorizado e cadastrá-lo em `public.tvt_admins`.
5. Preencher **somente valores públicos** em `main/public/js/telemetria-config.js`; replicar o arquivo à branch `gh-pages`. Jamais incluir `service_role` ou secret key no frontend.
6. Testar admin sem sessão e com sessão não autorizada: nenhum dado privado deverá estar acessível.

## GO / NO-GO

- [ ] O site público funciona mesmo sem Supabase.
- [ ] O admin não lê ou altera dados sem autenticação/autorização.
- [ ] Acesso anônimo não pode escrever configurações nem ler telemetria.
- [ ] Ativar/desativar ferramenta reflete na TV após atualização.
- [ ] Perfis de gesto funcionam por TV sem alegar calibração física do hardware.
- [ ] Nenhuma chave secreta é publicada ou exposta.
- [ ] Branch `gh-pages` contém somente conteúdo web sem pastas SQL privadas.
- [ ] GitHub Pages responde e testes reais nas três TVs Android 14 são documentados.

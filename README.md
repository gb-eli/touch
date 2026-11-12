# 📺 TV TOUCH AGV — v1.6

Portal pedagógico interativo para três painéis Android de 86 polegadas do Colégio Estadual Alberto Gomes Veiga (Paranaguá/PR). HTML/CSS/JS estático, GitHub Pages e Supabase opcional.

## Estrutura

- `main/public/`: código-fonte do site (portal e admin)
- `main/supabase/`: SQL, regras de acesso e funções do backend; **não publicar**
- `main/docs/`: documentação técnica e implantação
- `gh-pages/`: **somente** os arquivos estáticos de `main/public/`, na raiz, sem SQL nem workflows

## Ambientes

- **Público**: `index.html` — ferramentas, vídeos 360°, laboratório 2D/3D, diagnóstico e seleção de disciplina sem login.
- **Admin**: `admin.html` — Supabase Auth e autorização via `tvt_admins`; métricas, bloqueio/liberação de recursos e ajustes de gestos por TV.

## Publicação com menor uso de GitHub Actions

Não há workflow personalizado de publicação na `main`. Em **Settings → Pages → Build and deployment**, escolher **Deploy from a branch**, branch **gh-pages**, pasta **/(root)**.

O GitHub Pages executa automaticamente o workflow *gerenciado pelo GitHub* para publicar a branch: isso não equivale a **zero minutos garantidos**, especialmente em repositório privado. A exclusão do workflow personalizado evita nossas execuções próprias de build e deploy.

**Atualizações não são automáticas:** depois de aprovar mudanças em `main/public/`, sincronizar esses arquivos com a raiz de `gh-pages` e fazer push nessa branch. Não copiar as pastas `supabase/`, `docs/` ou segredos para `gh-pages`. Para não usar nenhum GitHub Actions, hospedar fora do GitHub Pages (por exemplo, Cloudflare Pages), mantendo o repositório no GitHub.

Não há Supabase ativo por padrão. As ferramentas locais funcionam sem backend; métricas reais e controles remotos dependem de projeto dedicado.

Veja [arquitetura](docs/ARCHITECTURE.md) e [implantação](docs/DEPLOY.md).

## Interface de toque (v1.6)

O script `public/js/ux.js` adiciona temas **Black**, **Claro** e **Colorido** (com variação suave e aleatória de matiz e intensidade), preferência por navegador, botão para pausar a animação e atalhos de aula. O mesmo tema acompanha portal público e administração. Em telas sensíveis ao toque, os controles têm alvos ampliados.

A publicação é pela branch `gh-pages` (raiz), sem workflow personalizado. A alteração em `main` **não publica** automaticamente: a branch `gh-pages` deve receber os novos arquivos. O build gerenciado do GitHub Pages continua existindo.

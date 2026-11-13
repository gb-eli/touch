# TV TOUCH Studio 2.6 — GO/NO-GO da integração
Data: 2026-11-13
Repositório: gb-eli/touch
Publicação: main + gh-pages (subárvore public/), preservando o link principal.

## Integrado
PR #14: piano multitoque e host modular.
PR #15: sólidos texturizados em Canvas 2D e encaixe em 3 níveis.
PR #16: biblioteca de temas 360°, paleta funcional e navegação mobile.

## Validação executada
- 14/14 testes de lógica (piano 5, geometria 4, UX 5) aprovados em JavaScript com mocks, usando a versão combinada do app.js/index.html.
- IDs do HTML: 163 elementos identificados sem duplicação na composição inicial.
- Componentes e controles das três PRs preservados.
- Checagem de sintaxe de scripts e presença de assets em pré-publicação.
- Service worker atualizado para cache tvtouch-studio-v2.6.0-unified sem novos workflows.
- Nenhum código Admin, credencial, permissão, RLS ou Supabase alterado.

## Limites que permanecem
- Os cenários JS usam simulação de DOM, Canvas e Web Audio. Não medem latência real, FPS, toque infravermelho nem hardware WA86F.
- Texturas procedurais não equivalem a render PBR; capas da biblioteca são ilustrações editoriais, não fotografias.
- A biblioteca 360 continua formada por PESQUISAS temáticas, não vídeos individuais homologados.
- Screenshots e verificação navegador live necessários após deploy. Anotar qualquer erro e corrigir antes de compartilhar.
- Validar fisicamente 2/3/5 contatos e performance na Samsung WA86F em aula piloto.

## Rollback
A branch gh-pages anterior permanece como commit 8de9b39a3cafdfcebfaef70a48b63f3e654450fd (Studio 2.2).
Para reverter, criar um commit que repõe a árvore anterior do site na gh-pages (sem force push).

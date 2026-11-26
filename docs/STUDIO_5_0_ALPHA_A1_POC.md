# Alpha A1 — experimento de consolidação CSS
26/11/2026. Escopo exclusivamente local, sem publicação.
Inventário: docs/STUDIO_5_0_ALPHA_DEPENDENCIES.json (commit 905d20f2). Home 18 CSS/18 JS; Oficina 9/10; Arcade 8/8; Aventuras 1/1; admin 7/7; Tech News com script e CSS inline. Todos os scripts externos da Home são clássicos com defer. Não consolidar JS até mapear globais, eventos, ordenação e efeitos colaterais.
A lista de precache tem 60 referências; Aventuras e seus CSS/JS não estão na lista. Isso não prova que a navegação offline pós-visita falha: o SW tem cache em runtime. Validar instalação, carga fria offline e retorno após visita separadamente.
POC conservadora, Node 22 nativo, sem dependência nova: agrupa apenas links contíguos canônicos em css/, mantendo piano separado e ordem, sem minificar nem reescrever URLs. Os 17 CSS elegíveis da Home foram inspecionados estaticamente: não foi encontrado @import, @charset ou @namespace. Dois fazem referência a ../assets/agv-synapse-crystal.svg; localização do bundle preserva o caminho. Potencial de 18 para 3 links CSS se a estrutura contígua for confirmada na execução real; não é benchmark nem resultado de rede. Não é bundler de produção; limites de parser, CSSOM, fontes, cache e renderização ainda exigem teste.
Executar em clone local, com Node 22:
```sh
node --test tests/alpha-css-poc.test.cjs
node scripts/alpha-css-poc.mjs public /tmp/agv-alpha-poc
```
A saída deve ser uma pasta nova, externa a public, com pai existente; não publicar, não copiar para gh-pages. Servir apenas em localhost, em origem isolada de qualquer outra cópia. Service worker permanece original nesta POC; integração de cache e offline pendente.
Evidência local: Node v22.16.0, node --check aprovado, 4/4 testes sintéticos aprovados (ordem/URL/piano/JS, limites, diretivas, isolamento de saída). Clonagem do repositório completo indisponível no ambiente por DNS (Could not resolve host: github.com). Sem execução do build sobre a árvore completa, suíte legada ou Chromium. Git blob SHA local: script 4fa812f2f4e7e350a794c22c646a1904a65b0846; testes a1a2aa30563b874cec3ebf5f1ca37304331f26e7. Nenhuma alteração em public, main, gh-pages ou workflows.
Próxima etapa: inventário JS e contratos estáticos, prova do POC sobre árvore real, comparação visual/computed styles nos 7 viewports, testes de rota, cold load, cache e offline. Só depois escolher estratégia definitiva de bundling com ferramenta fixada. Manter Alpha isolada; sem merge nem publicação.

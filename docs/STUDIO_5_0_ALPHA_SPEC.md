# AGV TOUCH — Studio 5.0 Alpha | Especificação técnica
Data: 26/11/2026. Estado: especificação inicial; nenhuma implementação ou publicação.
Base de código main: 9fda57ce924fff27e598cf1c3dcfb4d2cedf8a1a
Snapshot gh-pages observado: 02c4db9867aaceca48f87544a600940b3bf67aab
Escopo: somente TV TOUCH / AGV TOUCH, não IBC nem AGV+.

## 1. Evidências e reconferências
Fontes: [pasta da auditoria](https://drive.google.com/drive/folders/1B75ZD2aQzLD7ksAcyGfooI8QHkXq-XcG), [relatório editável](https://docs.google.com/document/d/1e6uaDcs0vnyT7J_b-oini6atX_SjCRmCh9RrdIHMsp8/edit), [matriz](https://docs.google.com/spreadsheets/d/1KlL8AkHnRaGnp3WBF4tUNiTDNPduEZ9E5IrrlzVVKqg/edit), [logs JSON](https://drive.google.com/file/d/1P2DAqdlx1gQko2hszNOMagJY4Ecv-yIP/view), [83 imagens](https://drive.google.com/file/d/1KZam_FCcJwy9opHkuY-5U4hwrNtch0FB/view).
- ZIPs íntegros: quatro JSONs legíveis e 83 JPEGs decodificáveis, inspecionados em painel de contato. Nem todas as 63 combinações rota/resolução possuem captura correspondente. Muitas capturas das rotas internas do portal ainda exibem a Splash sobreposta; DOM subjacente não comprova visibilidade.
- public/css: 21/26 arquivos contêm prefers-reduced-motion; ausentes em admin-controls.css, admin.css, diagnostico.css, governance.css, telemetria.css. Incluindo public/experiences/piano/style.css: 22/27. Presença da regra não comprova comportamento integral de acessibilidade. A afirmação inversa no relatório editável deve ser corrigida em errata.
- m1_prod_matrix e m2_preview4: 35 e 28 medições de páginas/redimensionamentos, sem overflow horizontal nas 63. Home 3.8→4.0: 1280x720 1,00→1,00; 1280x630 1,14→1,14; 1024x600 1,00→1,05; 844x390 1,00→1,62; 390x844 2,91→2,84. Overflow vertical; mobile retrato pode rolar intencionalmente. Não generalizar para piano e demais estados internos.
- Load_ms é carga inicial única por URL em 1280x720 DPR3 conforme esclarecimento do auditor, não benchmark independente por viewport. Não extrapolar FPS, carga ou multitoque para WA86F física.
- Aventuras: logs mostram Fase 1/4 Vale Solar, placar 020 no 2D e 010/020 em capturas distintas do 3D, canvas_changed=true. Não há evidência de avanço de fase, vitória ou chefe. Fases 2–4 e chefe somente verificação de código segundo auditor.
- Planilha contém pelo menos um valor de alvos pequenos (Aventuras preview4) convertido indevidamente para data; conferir com log bruto antes de usar.
- GO para especificação e desenvolvimento isolado. NO-GO para promover preview4, certificar a plataforma integralmente ou declarar teste físico aprovado.

## 2. Fase 1 — estabilização e limpeza (escopo Alpha)
A1. Inventariar referências HTML, CSS e JS, ordem de carregamento, globais, efeitos colaterais, dependências, service worker, caminhos relativos /touch/ e contratos de testes. Medir baseline antes da alteração. Propor bundler leve com versões fixadas após POC; manter fonte legível, evitar colisões e preservar ordem de cascata/execução. Não apenas concatenar ou minificar sem testes. Não impor SPA nesta fase.
A2. Corrigir transbordamento não intencional do portal em 1280x630, 1024x600 e 844x390. Preservar acesso integral às ações e navegação por teclado e toque; não esconder conteúdo com overflow:hidden para simular aprovação. Mobile retrato permite rolagem natural. Validar as 7 configurações originais: 1280x720 DPR3, 1280x630 DPR3, 1024x600 DPR1, 844x390 DPR2, 1920x1080 DPR1, 3840x2160 DPR1 e 390x844 DPR2.
A3. Abertura direta no dashboard; eliminar bloqueio da Splash e CTAs redundantes sem autoplay de áudio. Preservar tutorial sob demanda, skip-link funcional e foco correto. Confirmar captura após abertura, não apenas DOM.
A4. Corrigir viewport mobile do Tech News; testar 390x844 e demais resoluções. Manter estética editorial, conteúdo e rotas.
A5. Limpeza textual pontual: 'Captura obrigatória'; remover badge de resolução fixa do Arcade; ocultar jargões técnicos sem utilidade; mover créditos sem suprimir autoria; remover instruções de teclado fixas apenas quando houver alternativa de ajuda acessível; corrigir favicon 404 se reproduzido. Nome AGV TOUCH; sem redesign completo nem falsas promessas 3D.
A6. Perf: investigar loop agvSynapseField; pausar quando oculto ou página em background, reiniciar sem múltiplos RAF; manter contratos de reduced motion e preservar suporte WebGL1 existente. Melhoria antecipada de baixo risco (proposta), não reconstrução de motores.

## 3. Critérios de aceitação Alpha
- 0 regressões funcionais em rotas públicas e ferramentas existentes; inventário de 25 funcionalidades como cobertura, não afirmação de 25 homologadas.
- Sem transbordamento horizontal indesejado; Home em paisagem curta sem perda de controles e sem excesso vertical não intencional. Verificar conteúdo efetivamente acessível, foco, rolagem e ações.
- Home aberta diretamente; skip-link navegável, nenhum overlay bloqueante; screenshots reais com conteúdo visível.
- CSS/JS consolidado com redução comprovada das referências iniciais e sem novos conflitos. Métricas de rede e tamanho antes/depois; metas quantitativas de desempenho somente após baseline reproduzível.
- Tech News sem quebra em retrato; sem imagens ou conteúdo cortado.
- Smoke de Oficina, Arcade, Aventuras, Piano, Cosmos, Física, Memória, favoritos, diagnóstico e admin. Não modificar regras de jogos, dados persistidos, configuração de governança ou permissões.
- Testes unitários existentes, sintaxe JS, smoke Chromium, revisão de caminhos e offline básico. Cada URL/viewport: carga fria independente e redimensionamento em rodada separada, registrar método, DPR, versão e resolução; repetições com mediana e dispersão. Não chamar de benchmark físico.
- Fases 2–4 e chefe permanecem pendências explícitas de homologação; não confundir com sucesso da Alpha.
- WA86F: FPS sustentado, toque físico simultâneo, fullscreen, áudio e reflexo de sala continuam pendentes; somente depois de execução real poderão ser certificados.

## 4. Limites e sequência
Fase 2 Beta: SPA, Dock Touch 64px com alvos 56–72px, palco >=75% nos módulos relevantes, Oficina/Arcade e design system editorial. Fase 3 RC: motores 3D reais (avaliar Three.js conforme compatibilidade WebGL/hardware), Física, Porto e laboratórios disciplinares nativos. Fase 4 Final: homologação física, acessibilidade integral, offline nativo e implantação.
Não alterar banco, Auth/RLS, telemetria, credenciais, main ou gh-pages nesta etapa. Não abrir PR ou acionar release até validação local e aprovação de escopo. Workflow quality.yml observado: push em main ou PR para main, não push em branch de desenvolvimento.
Entregas: (1) mapa de dependências e baseline; (2) POC build; (3) implementação incremental isolada; (4) QA local e comparativo; (5) auditoria independente e decisão de promoção. Preservar ZIPs e fontes no Drive; registrar SHA e evidências por etapa.

# Homologação Studio 3.8.0 — Samsung WA86F

**Situação:** plano de QA de uma revisão isolada; não documenta deploy ou certificação física da versão 3.8.0.

## Referência e origem das observações

- Ambiente: TV interativa Samsung WA86F, navegador da própria TV, orientação horizontal.
- Fotografia do diagnóstico da 3.7.2: **1280×720 pixels CSS, DPR 3×, Chrome 157 no Linux ARM**; informações reportadas pela aplicação.
- Resultado observado pelo teste prático anterior: **16 contatos simultâneos** apesar do valor `navigator.maxTouchPoints = 1`.
- Leitura de fluidez do diagnóstico: **44 FPS aproximados** em amostragem curta de `requestAnimationFrame`; não é FPS medido dentro do jogo.
- Evidência de navegador anterior: testes Node, Chrome e release 3.7.2 aprovados. A interação física com pinça/rotação e estabilidade do 3D **não foi certificada**.

## Objetivo e intervenção

1. **Ergonomia:** nenhum atalho, tema ou destino essencial de paisagem com alvo vertical inferior a **44 pixels CSS**. O cabeçalho deve comportá-los sem sobreposição.
2. **Hierarquia:** autoria em HTML preservada; não sobrepor o dock de atividades no modo horizontal (capturas anteriores exibiam sobreposição).
3. **Diagnóstico:** no teste voluntário de oito segundos, reconhecer os movimentos de dois pontos de contato **aproximando** e **afastando**; ignorar jitter inferior a 22 px ou a 18% da distância inicial. Usar apenas PointerEvents do próprio teste; não persistir coordenadas.
4. **Privacidade:** nenhum dado de alunos, IP público ou coordenadas enviados ou incluídos no relatório; exportar no máximo os nomes dos gestos observados.
5. **Desempenho:** evitar introduzir animações contínuas. Não reduzir automaticamente a qualidade 3D por causa dos 44 FPS do teste de diagnóstico.

## Matriz de verificação

| Viewport | Rota | Cenário | Aceite |
|---|---|---|---|
| 390×844 | Portal, Oficina, Arcade | Vertical, sem rolagem horizontal | Regressão automática |
| 844×390 | Portal | Oito atalhos, header, dock, texto e controles de 44 px | Captura + medidas Chrome |
| 1024×600 | Portal, Oficina, Arcade | Paisagem com navegador | Captura + medidas Chrome |
| 1280×720, DPR 3× | Portal e Diagnóstico | Alvos, rolagem até o último cartão, crédito fora do dock | Captura + medidas Chrome |
| 1280×720, DPR 3× | Diagnóstico | Dois pontos móveis, afastar e aproximar | Eventos sintéticos no Chrome; não valida hardware |
| 1366×630 | Portal e Oficina | Espaço útil com barra do navegador | Captura + medidas Chrome |
| 1920×1080 | Portal, Oficina, Arcade | Full HD | Smoke e captura |
| 3840×2160 | Portal, Oficina, Arcade | 4K, limite de pixels GPU do WebGL | Smoke e captura |

**Não substituir** o teste de toque real por simulações do Playwright.

## Roteiro de aceite físico (PENDENTE)

Na TV, abrir o endereço da versão liberada após a aprovação de produção e conferir:

- Em modo navegador e fullscreen: todos os destinos acionáveis; nenhum controle ou crédito encobre o dock.
- Página inicial: seis cartões principais e oito atalhos; tocar nos extremos da tela e navegar de volta sem perda de contexto.
- Diagnóstico: iniciar os oito segundos; colocar dois dedos, afastar pelo menos 3 cm e aproximar novamente; conferir os nomes dos gestos no resultado e no resumo.
- Repetir com mais dedos e registrar o **máximo efetivamente observado**, sem depender de `maxTouchPoints`.
- Oficina 3D: testar toques simultâneos, rotação, arraste e pinça; mudar materiais e completar parte de um desafio, verificando mensagens de erro.
- Arcade, Universo e Quadro: navegar por cinco minutos, registrar interrupções, telas em branco e lentidão *observada*, sem declarar FPS de jogo não medidos.
- Desligar a rede por curto período apenas se permitido e testar navegação offline sem tocar em configurações administrativas.

Registrar somente: horário aproximado, versão do aplicativo, rota, gesto, resultado e observações. Não fotografar estudantes, credenciais ou conteúdo privado.

## Segurança / publicação / reversão

- O PWA já tem `manifest.webmanifest`, `touch-fullscreen.js` e `service-worker.js`. Não duplicar controles de tela cheia.
- Publicação exige PR revisada, testes Node/Chrome aprovados, **autorização explícita** e deploy verificado na branch `gh-pages` (raiz de `public/`).
- Referência de rollback da produção anterior: commit `gh-pages` **`6b48514ba3bad001b89d010d161e9bbea24e8f95`**, validado na Studio 3.7.2.
- O plano não autoriza modificações em Supabase, autenticação, permissões, dispositivos físicos ou exclusão de branches antigas.

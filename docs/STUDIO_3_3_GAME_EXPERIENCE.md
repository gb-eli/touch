# AGV TOUCH Studio 3.3 — Motor compartilhado de experiências

## Objetivo

Padronizar respostas de jogo no AGV TOUCH sem reescrever regras nem comprometer a renderização 4K dos jogos já publicados. A experiência deve oferecer feedback claro, previsível, responsivo e sensível às preferências de acessibilidade. Referência: issue #26, PR #29, Studio 3.2.

## Arquitetura

Novo `public/js/game-experience.js`, exposto como `window.AGVGameExperience`. API congelada e local, sem dependência externa:

- `createSession(id, {root})` — sessão independente com estados `idle`, `playing`, `paused`, `completed`, contador de rodadas e `dispose()`.
- `session.transition(action)` — autoriza somente transições declaradas. Impede pausar antes de começar e retomar após concluir.
- `session.emit(type, {target, visual, audio})` — eventos compartilhados: `start`, `pause`, `resume`, `reset`, `hit`, `correct`, `wrong`, `score`, `win`, `lose`, `draw`, `select`, `move`.
- `setSound(boolean)` — solicita permissão de Web Audio somente após clique explícito; `soundEnabled()` e `tone()` são a única interface de som para novas integrações.
- `prefersQuiet()` — respeita `prefers-reduced-motion`, `agv-quiet-mode`, `Save-Data` e página não visível.
- `stop()` — fecha contexto de áudio e desativa sessões ao sair da página.

A camada visual `public/css/game-experience.css` aplica no máximo **24 partículas DOM simultâneas** (até 6 por evento), removidas após a animação. O Arcade conserva seu próprio sistema de partículas Canvas com limite de 66, adequado a efeitos dentro do jogo, mas migra o **som** e os **estados de partida** para o motor compartilhado. Efeitos nunca interferem em cliques ou acessibilidade, pois são `aria-hidden` e `pointer-events:none`.

## Integrações entregues

| Área | Eventos | Como o som inicia |
|---|---|---|
| Arcade — Snake, Pong, Basquete e Sinuca | Iniciar, pausar, retomar, concluir, impacto e pontuação | Botão `♫ Som desligado` |
| Oficina — Blocos, Conexões, Velha, Damas e Foto | Iniciar experiência, sucesso, erro e sinais leves de toque | Botão `♫ Ativar efeitos sonoros` |
| Memória | Reiniciar, selecionar, encontrar par, erro e completar tabuleiro | Botão `♫ Som dos jogos desligado` |
| Encaixe | Iniciar nível, tentativa incorreta, encaixe correto e completar nível | Botão no cabeçalho do Laboratório |
| Porto | Iniciar simulação, escolher alternativa, acertar/errar e concluir | Botão no cabeçalho do Laboratório |

Tudo funciona no próprio navegador, sem login ou registro de pontuações. A simulação visual e a PWA não incluem áudio protegido de terceiros.

## Segurança, limitações e acessibilidade

- Nenhuma chamada de rede, telemetria, localização, pontuação persistida ou processamento de fotografias pelo motor.
- Preferências sonoras não são salvas: todo carregamento começa silencioso, inclusive para menores.
- Animação decorativa é removida em `prefers-reduced-motion` ou economia de dados.
- Feedback continua textual e anunciado pelos elementos `aria-live` de cada jogo, independentemente dos efeitos.
- A Studio 3.3 **não adiciona** xadrez, multiplayer online, construção WebGL nem motor de física tridimensional. Esses recursos permanecem nas issues #27 e #28.
- A escolha de variantes oficiais de Damas e aprofundamento das CPUs segue pendente em outra etapa.

## Critérios de aceite

- `node --test tests/*.test.cjs` e verificação de sintaxe JS aprovados no GitHub Actions.
- Testes unitários da máquina de estados e áudio por gesto concluídos, incluindo limite de 24 partículas e comportamento com movimento reduzido.
- Chrome real em 390 × 844, 1920 × 1080 e 3840 × 2160: sem overflow horizontal ou erros JS; Arcade e Oficina funcionam com som opcional.
- Memória: completar par; Encaixe: encaixe certo; Porto: identificar uma resposta correta, todos com status textual.
- Testes físicos na Samsung WA86F **pendentes**: 5–10 toques simultâneos, caneta, som, tela cheia, FPS, estabilidade de 10 minutos e comportamento do navegador Android integrado. Resultados de Chrome automatizado não são substitutos desses testes.

## Próxima entrega

Studio 3.4: melhorias de física e animação de movimentos reais (Sinuca, Basquete, blocos e encaixe), desafios temporizados, dificuldade por jogo e padrões de menu. Design e performance devem ser validados antes de ampliar o catálogo.

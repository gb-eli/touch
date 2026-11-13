# AGV TOUCH — Studio 3.2 | Padronização transversal e game feel

Referência: 13/11/2026 · Repositório `gb-eli/touch` · Samsung WA86F 86" (validação física ainda pendente).

## Objetivo e limites

O AGV TOUCH deve parecer uma única plataforma educacional, não um conjunto de demonstrações separadas. A identidade é **sináptica/prismática**, com preto profundo, superfícies violeta e acentos coral/ciano de alto contraste. Não usar cartões ou fontes pastel como padrão. O tema Claro opcional usa fundos neutros e texto escuro legível. Evitar partículas caras em toda a tela, principalmente no Android da WA86F.

Esta release **não** transforma Canvas 2D em WebGL, não adiciona xadrez ou LEGO real, não substitui áudios protegidos de terceiros e não modifica segurança, telemetria, Supabase ou dados pessoais.

## Alterações Studio 3.2

1. `css/agv-design-system.css`: última camada CSS sobre estilos legados de home, Arcade, Oficina e admin. Tokens de superfície, texto, borda e acentos. Maior consistência em cartões, cabeçalhos, painéis de jogos, piano, indicadores e administração.
2. `js/agv-touch-feedback.js`: ondas sinápticas em ações selecionadas, no máximo sete simultâneas, com remoção automática e respeito a `prefers-reduced-motion`, opção `Reduzir efeitos` e `Save-Data`. Não captura coordenadas para telemetria.
3. `js/arcade.js`: sintetizador de efeitos acionado apenas após clicar em `Som ligado`, sem som obrigatório; pontos, rebotes, cestas, encaçapadas e conclusão possuem sinais suaves. Partículas de Canvas limitadas a 66 unidades totais e 22 por evento. Renderizador mantém orçamento adaptativo até 3840 × 2160.
4. `js/oficina.js`: marcas novas do jogo da velha e última peça movimentada em damas recebem animação; peças antigas não reiniciam efeitos a cada jogada.
5. Portal e títulos: assinatura da release atualizada e títulos que descrevem ações em vez de slogans genéricos.
6. PWA: cache `tvtouch-studio-v3.2.0-design-system`, com novos CSS/JS incluídos e exclusão do admin do pré-cache.

## Matriz de conformidade por área

| Área | Studio 3.2 | QA pendente |
| --- | --- | --- |
| Início e navegação | Contraste, cartões, realce de toque, assinatura | Capturas em 360/390/430/768/1920/3840 px; navegação sem scroll excessivo |
| Cosmos | Identidade do portal preservada | FPS WebGL e fallback Canvas 2D na WA86F |
| Memória | Cartas e foco coerentes com o portal | Animação de flip, reinício após pares, toque simultâneo |
| Física 2D | Controles preservados | Arrasto, queda de FPS, sensores e limites |
| Piano | Superfícies, cor do volume, foco e painel alinhados | Multitoque real com 5+ dedos e latência sonora |
| Biblioteca / vídeos 360° | Cartões alinhados ao sistema | Curadoria de vídeos reais (atualmente são pesquisas), miniaturas verificadas |
| Laboratório: quadro, sólidos, encaixe, porto | Cores, CTA, foco e padrões do portal | Gesto com caneta, texturas, responsividade e reação dos desafios |
| Arcade 4 jogos | Cores, sons opcionais, partículas leves, CTA | Jogos completos e FPS por equipamento; física e CPU não foram reescritas |
| Oficina 5 jogos | Cores, marcações de turno e indicadores | Damas regras oficiais, blocos 3D real, quebra-cabeças e padrões no Android |
| Administração | Superfícies, indicadores e formulários coerentes | Teste de login legítimo, permissões e dashboard somente leitura |

## Contrato de interface para novos módulos

- A ação principal deve ficar clara nos primeiros cinco segundos, sem texto abstrato.
- Cada gesto de sucesso ou erro deve emitir resposta visível em menos de 150 ms (objetivo de teste físico, **não resultado medido**).
- Regras de pontuação, início, pausa, reinício, vitória, derrota, empate e turno precisam estar identificadas.
- Contraste de texto principal mínimo de 4,5:1 e controles com foco de teclado visível.
- Controles touch importantes com altura-alvo de 56 px no desktop e 64 px na TV sempre que o layout permitir; não prejudicar a densidade mobile.
- Animações devem ser reversíveis e ignoradas em modo de movimento reduzido.
- Som de jogos desligado por padrão, iniciado somente por gesto; abertura sintetizada existente iniciada por `Começar agora`.
- Não coletar nomes de alunos, mídia enviada, desenhos nem pontuações; fotografias locais não são enviadas.
- Imagens externas precisam ter licença verificada, legenda e conteúdo previamente conferido.

## Débitos técnicos priorizados

### P0 · Homologação física

- Multitoque na Samsung WA86F, inclusive touch via USB-B com PC externo quando aplicável.
- Perfis de 1920×1080 e 3840×2160, medição de FPS, memória e tempo de resposta.
- Avaliar a qualidade do áudio, modo tela cheia e comportamento depois de 10 min de uso.
- Validar diferenças do navegador Android integrado versus Chrome mobile.

### P1 · Studio 3.3 | Sistema de interações

- Biblioteca comum e configurável de feedback/sound cues para **todos** os jogos (Arcade, Oficina, Memória, Encaixe, Física), com estados de jogo padronizados.
- Animações orientadas ao movimento real (trajectory/FLIP), não apenas brilho ou transform.
- Medidor opcional de dificuldade, desafios temporizados, modo aula, seleção de jogadores locais e tutorial por jogo.
- Corrigir regra de damas conforme variante escolhida; testes completos de captura múltipla, promoção e encerramento.
- Refinar lançamento da bola da sinuca e a previsão visual antes da tacada.

### P2 · Studio 3.4–3.5 | Qualidade e construção

- Consolidar um sistema de texturas PBR originais para WebGL, quando viável; fallback Canvas.
- Blocos de construção em cena 3D com câmera, encaixe, peças multiformato e colisões.
- Miniaturas fotográficas licenciadas / geradas e experiências imersivas de qualidade.
- Instrumentar FPS por jogo sem armazenar dados pessoais; perfis de renderização adaptativos.
- Biblioteca única de jogos com filtros de idade, disciplina, controle e número de jogadores.

### P3 · Studio 3.6 | Expansão de jogos

- Xadrez com regras completas, jogada válida, xeque-mate, empate, níveis e modo duas pessoas.
- Construção modular tipo LEGO com peças próprias e sem recursos proprietários.
- Conexões de pontos com visualização progressiva e variações de dificuldade.
- Jogo da memória com imagens fotográficas e desafios por disciplina.

## Testes

- Suíte `tests/studio-3-2.test.cjs` e suites regressivas existentes devem passar.
- HTML deve carregar `agv-design-system.css` depois dos estilos legados.
- CSS não deve conter blocos desbalanceados; JS deve compilar.
- A homologação de navegador real e do equipamento **não pode ser marcada como aprovada apenas com testes estáticos**.
- Se algum teste ou revisão visual falhar: não publicar; corrigir na branch e executar a regressão novamente.

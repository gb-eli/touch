# AGV TOUCH Studio 3.0 — UX/UI em toda a plataforma

## Problema corrigido
O tema da Studio 2.9 havia uniformizado cores, efeitos e crédito, mas a navegação e o comportamento das interfaces continuavam desconectados. A Studio 3.0 estabelece uma camada de UX transversal ao portal, laboratório, módulos, jogos e administração.

## Navegação
- Barra contextual com seção atual, descrição prática e botões Voltar, Início e Encontrar atividade.
- Busca global por atividades e jogos no topo do portal e nas páginas Arcade/admin. Atalho Ctrl+K (Cmd+K no Mac). Modal nativo, fundo escurecido, teclado, ESC, grupos de resultados e busca sem acentos.
- 20 entradas de navegação: áreas, módulos do laboratório, piano, física, memória, planetário, quatro jogos e administração (acesso restrito continua intacto).
- Deeplink seguro: index.html?tool=desenho|solidos|encaixe|porto; arcade.html?game=snake|pong|basket|pool.
- Histórico de navegação contextual para botão Voltar. Não cria novo sistema de autenticação.

## Comportamento e acessibilidade
- Tamanhos mínimos de controles de 48–62 px conforme viewport/touch, foco visível, animações breves, seleção ativa legível e feedback táctil.
- Modais com acessibilidade nativa e foco inicial na pesquisa. Informações contextuais não exigem login.
- Preferência "Reduzir efeitos": desativa sinapses de fundo, persiste localmente e cancela loop de renderização, além de respeitar prefers-reduced-motion e Save-Data.
- Efeitos não bloqueiam conteúdo (pointer-events:none), detêm-se em aba oculta e não modificam o canvas de atividades.

## Design transversal
- Home, navegação, cards, biblioteca, filtros, diálogos, vídeos 360, favoritos, guia, diagnóstico e controles.
- Laboratório: quadro, sólidos geométricos, encaixe e desafio portuário. Paleta e affordances consistentes sem alterar física/algoritmos.
- Piano: instrumento conservando visual de teclas brancas e pretas, painel e botões com identidade do portal.
- Arcade: controles, seletor de jogo, modos 2D/3D, pontuação e tela cheia, sem reduzir qualidade do bitmap de até 4K.
- Administração: indicadores, formulários, tabelas de controle e status, mantendo lógica de autenticação e registros existentes.
- Alternativas de tema claro e colorido com ajustes de contraste e foco.
- Crédito "Desenvolvido por Gabriel Elienai" permanece no canto inferior direito.

## Garantias e riscos
- Preserva rotas, IDs de módulos, eventos, API de favoritos, painel e dados.
- Sem mudanças em banco, permissões, pagamentos ou dependências externas.
- Arquivos CSS/JS adicionados ao cache PWA v3.0.
- Testes automáticos cobrem integrações; QA físico Samsung WA86F e screenshots reais permanecem necessários.

## Plano de QA na Samsung
1. Abrir home, pular abertura, iniciar com som; verificar toque em 4 pontos e botão de repetição.
2. Abrir "Encontrar atividade" em todas as entradas, filtrar texto, usar teclado e fechar; testar navegação e retorno.
3. Abrir todas as 13 páginas internas e os 4 módulos do laboratório; conferir hierarquia, legibilidade, scroll e foco.
4. Testar multitouch no piano e atividades, navegando entre elas sem congelar.
5. Conferir os quatro jogos em 2D/3D, fullscreen, 4K e controles touch; avaliar FPS durante 10 min.
6. Conferir layout com tema claro, modo reduzido, orientação paisagem e portrait, 360/390/430/768/1920/3840 pixels.
7. Testar offline após cache; painel administrativo em modo somente leitura.

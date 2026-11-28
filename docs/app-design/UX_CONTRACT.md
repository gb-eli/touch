# TV Touch — contrato de experiência do MVP

**Criar. Experimentar. Aprender.**

Esta é a especificação de experiência para o aplicativo Android. Os protótipos HTML são referências navegáveis de produto; não demonstram execução nativa, câmera ou realidade aumentada. A produção seguiu a sequência mapa → baixa fidelidade → alta fidelidade.

## Recorte do MVP

O primeiro produto é um laboratório criativo com um construtor de blocos, quatro missões, projetos salvos e diagnóstico. A entrada no aplicativo e as atividades de toque independem de login, câmera e conexão. A experiência de RA é uma etapa posterior, com capacidades verificadas no dispositivo; um painel de disponibilidade não representa uma implementação de RA.

| ID | Tela | Conteúdo e ação principal | Saídas |
| --- | --- | --- | --- |
| `home` | Início | Atalho para construir; missão da ponte; projetos recentes; informações de disponibilidade. | Explorar, construtor livre, briefing da missão, projetos. |
| `explore` | Explorar | Atividades agrupadas por Construir, Desafios e Câmera; filtros reais. | Construtor, briefing, painel explicativo de câmera. |
| `builder` | Construtor | Palco 3D claro; materiais; adicionar/apagar/girar; desfazer/refazer; salvar. | Projeto salvo, resultado de missão, volta ao destino de origem. |
| `projects` | Meus projetos | Lista local, prévias, nome e data; estado vazio, abrir, renomear, excluir e importar/exportar JSON. | Construtor ou criação de projeto. |
| `mission` | Missão | Objetivo de ponte, torre, escada ou simetria; começar. Resultado é um estado da missão. | Construtor com missão, resultado, repetir ou criar livremente. |
| `settings` | Ajustes e diagnóstico | Perfil Auto/Celular/TV; movimento reduzido; meta de renderização 30/60; diagnóstico de recursos. | Navegação principal; dados de diagnóstico somente leitura. |

## Navegação e adaptação

- Quatro destinos principais: **Início · Explorar · Projetos · Ajustes**.
- Móvel de referência: **412 × 915 px**; barra inferior de 76 px, respeitando área segura. Conteúdo pode rolar. Botões mínimos de 48 px.
- Paisagem de referência: **1280 × 720 px**; rail de 200 px com ações na região média/baixa, conteúdo flexível. Ações do construtor ficam na base, com alvos de 56 px.
- A partir de 840 px, usar navegação lateral. Nenhuma informação depende exclusivamente de hover.
- Telas de atividade usam título, voltar e estado da atividade. Ações frequentes ficam próximas ao palco, sem cobrir as peças.
- Na WA86F, tamanho físico, legibilidade, altura dos controles, multitoque e desempenho exigem teste presencial. Responsividade no navegador não é aceite da TV.

## Sistema visual

| Token | Valor | Uso |
| --- | --- | --- |
| `ink` | `#0D2230` | Rail, títulos de capa e superfícies escuras |
| `surface` | `#F4F7F3` | Fundo da área de trabalho |
| `paper` | `#FFFFFF` | Cards e painéis |
| `text` | `#163141` | Texto principal |
| `muted` | `#637984` | Texto secundário |
| `lime` | `#C7F36B` | Ação principal e pequenos realces |
| `cyan` | `#79DCEC` | Blocos e experiências de exploração |
| `border` | `#DCE7E3` | Divisórias e limites |
| `danger` | `#B23B43` | Exclusão e erros |

Tipografia: fonte de sistema sem serifa. Corpo 16 px; legendas 12–13 px; títulos 24–36 px. Hierarquia clara, contraste forte e rótulos curtos. Bordas arredondadas de 16–24 px; evitar cartões translúcidos, brilho decorativo e camadas de neon. O palco é claro para separar volume, sombra e cor dos blocos. O acabamento visual vem da composição e do comportamento das peças.

Movimento: entrada de tela curta (180–240 ms), feedback de botão (120 ms), estado de seleção evidente e transição da atividade relacionada à ação. Respeitar `prefers-reduced-motion`. Não usar cursor customizado que prejudique toque ou acessibilidade.

## Comportamento do construtor no protótipo

- Mundo de blocos com coordenadas inteiras; toque/click seleciona uma posição no piso ou na face. Uma prévia mostra o alvo. **Colocar bloco** confirma; selecionar não edita o mundo.
- Arrastar em modo Girar altera a vista; botões oferecem a mesma ação sem gesto complexo.
- Material escolhido é mostrado por cor, nome e indicador selecionado.
- Desfazer/refazer tem estado desabilitado quando não houver histórico.
- Salvar abre um diálogo com nome; o protótipo grava no `localStorage` deste navegador, identificado como armazenamento de demonstração.
- Excluir projeto exige confirmação contextual. Importar/exportar usa JSON com esquema e limites verificados. O protótipo nunca envia dados a serviços externos.
- Nenhuma função simula câmera, rastreamento corporal, sensor ou instalação Android.

## Missões implementáveis — regras do modelo legado

O mundo inicial é vazio, com fantasmas das posições desejadas. A regra avalia presença das peças-alvo e não representa uma simulação de engenharia estrutural. O palco usa a grade legada 8 × 8 e altura 6, até 256 blocos.

| Missão | Posições-alvo | Total |
| --- | --- | --- |
| Ponte de ideias | `(2,0,3)`, `(4,0,3)`, `(2,1,3)`, `(3,1,3)`, `(4,1,3)` | 5 |
| Torre criativa | `(3,0,3)` até `(3,4,3)` | 5 |
| Um passo de cada vez | `(2,0,3)`, `(3,0,3)`, `(3,1,3)`, `(4,0,3)`, `(4,1,3)`, `(4,2,3)` | 6 |
| Equilíbrio em blocos | `(2,0,2)`, `(5,0,2)`, `(2,1,2)`, `(5,1,2)`, `(3,0,3)`, `(4,0,3)` | 6 |

Briefing da ponte: “Construa duas bases e una o topo com um vão.” A atividade informa progresso `0/5` a `5/5`. Ao completar, o usuário escolhe ver o resultado; o jogo não remove o controle automaticamente. Resultado mostra o objetivo atingido e oferece salvar ou repetir. No construtor livre não há pontuação fictícia.

## Estados obrigatórios

| Situação | Resposta |
| --- | --- |
| Nenhum projeto | Estado vazio com CTA “Criar meu primeiro projeto”. |
| Armazenamento indisponível | Erro claro; a interface não informa que salvou. |
| Nome vazio | Mensagem junto ao campo; manter diálogo. |
| Câmera / RA | “Em desenvolvimento neste MVP”; sem solicitação de câmera. |
| Recurso informado pelo navegador | Rotular “informado”, sem tratar como teste físico. |
| Sair com alterações | Oferecer salvar ou descartar. |
| Missão incompleta | Mostrar quantas peças-alvo faltam e permitir continuar. |
| Movimento reduzido | Remover movimento não essencial. |
| Teclado | Foco visível; botões acessíveis; Escape fecha diálogos. |

## Separação entre protótipo e aplicativo

O protótipo de alta fidelidade tem navegação e manipulação demonstrativa de blocos. O ambiente de execução é o navegador. A implementação Android deve seguir as mesmas telas e regras, com persistência adequada ao aplicativo e verificação nativa de capacidades. A primeira validação física usa o Galaxy S25 Ultra; a WA86F possui aceite separado.

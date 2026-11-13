# TV TOUCH 3.0 — Curadoria de integração dos projetos

**Situação:** planejamento e seleção técnica. **Não** significa que os jogos estejam publicados.
**Equipamento-alvo:** Samsung WA86F, 86 polegadas, Android 14, orientação horizontal.
**Repositório destino:** gb-eli/touch. **Fonte:** GitHub dos projetos de gb-eli, main em 13/11/2026; SHAs fixadas em candidatos-touch-3.0.json.

## Decisão de produto

O TV TOUCH será uma central de atividades que cabem em um painel touch grande. Não será um agregador de links nem uma cópia dos sistemas de origem.

Uma experiência merece entrar quando entrega uma ação significativa com toque, um resultado visual claro e objetivo de aprendizagem verificável em menos de 15 minutos. O professor deve conseguir abrir, conduzir e encerrar a atividade sem login nem manual extenso.

**O que extraímos:** lógica de jogo, pequenas cenas, modelos GLB selecionados, texturas, cálculos didáticos, controles 360, mecânicas de desafio e tratamento de falhas.

**O que não extraímos:** páginas completas, autenticação de outros sistemas, dashboards alheios, perfis de aluno, dependências pesadas sem uso, cadastros, telemetria já existente nos outros projetos, grandes pacotes de assets, simulações de demonstração apresentadas como dados reais.

## Curadoria por repositório

| Origem | Código/asset verificado | Aplicação touch | Decisão |
|---|---|---|---|
| Fliperama DS | flipds/games/chess-arena-360/{engine.js,ai.js,game.js}; flipds/games/hexa-reactor/; flipds/games/voxelcraft-ds/ | Xadrez 3D, puzzle hexagonal, construção de cubos | Extrair motores e adaptar HUD/câmera; não carregar hub inteiro |
| LAB PORTOS 360 | assets/js/modules/container-40hc-inspecao/, inspecao-360/, navio-operacao/, ciclo-sts-descarga-3d/; assets/models/* | Inspeção 360, guindaste, navio, contêiner, missão de cais | Prioridade alta; aproveitar módulos com mount/unmount, GLB LOD |
| LAB TST 360 | modules/epi-lab/module.js, modules/eletricidade/module.js; GLBs de EPIs, trabalhadores e porto | Escolha de EPI, investigação de riscos, hotspot em 3D | Extrair cenários curtos; oferecer 2D e texto de feedback |
| LAB SAÚDE 360 | modules/corpo-humano/index.js, hospital-360/index.js; modelos anatômicos | Rotação, isolamento de estruturas, tour guiado que pausa ao toque | Prioridade média; conteúdo educacional, não orientação clínica |
| Planetário DS | src/modules/solar-remaster/SolarSystemRemasterModule.js; catálogo solar; controle de qualidade | Sistema Solar e comparação de corpos celestes | Reaproveitar dados e input, não duplicar plataforma; fallback 2D |
| LAB Física | js/modules/waves.js, ohm.js, mechanics.js; texturas PBR e modelos de bancada | Ondas/som, circuitos e forças | Isolar cálculo, sensores didáticos e interação visual |
| Lab Virtual | LABDS/lab/modules/audio-lab/index.js, graphics-lab/index.js, productivity-lab/index.js | Base para piano, pixel art e planilhas tocáveis | Reaproveitar Web Audio, grid e fórmulas; reconstruir UX para 86" |
| LAB Bioeconomia 360 | bio360/modules/missao-multilab/module.js; catálogo e missões | Economia circular, impactos e escolhas | Usar decisões curtas e indicadores simulados claramente identificados |
| Desafio DS | desafio 33/ (README e piloto guiado) | Missões e perguntas com feedback | Só padrão de progressão; NÃO transportar EduAuth/dados |
| LAB Meio Ambiente 3D | URL fornecida não localizada (404) | Possível ecologia, reciclagem e biodiversidade | Aguardar localização do projeto; nenhuma integração presumida |

O Fliperama documenta 25 experiências, LAB PORTOS 194 e Planetário 25; esses números vêm dos READMEs, não de uma homologação de todas as experiências. Na pasta principal de jogos do Fliperama foram localizadas diretamente 8 pastas jogáveis; a curadoria usa os módulos específicos encontrados.

## Filtro de seleção objetivo

Peso da avaliação de cada candidato:
- **30%** interação por toque: seleção, arraste, pinça ou multitouch de verdade;
- **25%** valor pedagógico e missão de 5–15 minutos;
- **15%** clareza do layout 16:9 com elementos grandes;
- **15%** desempenho gráfico, cache, descarte e fallback;
- **10%** operação sem login e, quando possível, offline;
- **5%** acessibilidade, alternativa de controles e movimento reduzido.

**Barreiras obrigatórias, mesmo com nota alta:** proveniência e licença dos componentes, ausência de informações sensíveis, segurança de links externos, compatibilidade com políticas do portal e nenhuma regressão de recursos existentes.

P0/P1/P2 do catálogo são **prioridades preliminares de implementação**, não pontuações obtidas na Samsung física.

## Primeiro pacote demonstrável — Studio 2.3 (fatia vertical)

1. **Piano touch**: instrumento original em Web Audio, 12–24 teclas grandes, polifonia com múltiplos toques, desafios de acordes e ritmo, controle de volume, pausa e áudio somente após gesto. Base técnica: audio-lab e módulo waves do LAB Física, sem músicas comerciais embutidas.
2. **Formas 3D e encaixe**: ampliar sólidos e encaixe já existentes; giro com um dedo, pinça para zoom, seleção de material, contagem de faces/arestas/vértices, desafios por nível.
3. **Inspeção de contêiner 40HC**: portar uma única cena de missão do LAB PORTOS; oito regiões de ronda podem compor nível seguinte, com vistas guiadas, checklist e LOD.
4. **Memória por disciplina**: ampliar jogo existente com níveis e cartas temáticas, sem usar notas escolares.
5. **Biblioteca de vídeos 360**: introduzir catálogo com campos de verificação; **não publicar vídeos não revisados**.

O pacote é um conjunto de pilotos. Publicar primeiro uma experiência por vez se os testes de toque e performance recomendarem.

## Segunda entrega — Studio 2.4

- Xadrez 3D com dois jogadores no mesmo painel, CPU opcional e câmera superior.
- Damas 2D com casas grandes e regras completas.
- Quebra-cabeça hexagonal e frutas/frações com arraste ou corte por swipe e alternativa por toque.
- Pixel art com cor, pincel, apagar, desfazer, salvar PNG.
- Portos: navio, portêiner e contêiner em missão curta, sem lógica de ERP ou dashboards copiados.

## Terceira entrega — Studio 2.5

- Segurança do Trabalho: escolha de EPI e identificação de riscos.
- Enfermagem: anatomia e tour clínico com pausa imediata ao toque.
- Física: ondas, som, eletricidade e movimentos.
- Astronomia: comparação de corpos e exploração com fontes revisadas.
- Bioeconomia, meio ambiente e geografia em desafios de causa/efeito.

## Matriz curricular / ideias adicionais

| Área | Experiências indicadas | Ação principal |
|---|---|---|
| Matemática | Frações com frutas, geometria e sólidos, desafios de cálculo, xadrez/damas | Arrastar, cortar, medir, comparar |
| Física | Gravidade, ondas, circuitos, forças, atrito, ótica | Mover corpos e variar parâmetros |
| Química | Tabela periódica interativa e reações apenas simuladas | Montar, classificar, observar efeitos |
| Biologia | Corpo humano, ecossistemas, conservação | Selecionar estruturas e observar relações |
| História | Mapas e linhas do tempo, reconstruções e visitas 360 | Localizar, ordenar, comparar épocas |
| Geografia | Globo/mapas, relevo, portos, oceanos e clima | Aproximar, girar, encontrar regiões |
| Artes/Música | Piano multitoque, desenho livre, pixel art, cores, ritmo | Tocar, compor, desenhar |
| Português/Idiomas | Memória temática, ordenar frases, associação imagem/palavra | Selecionar, organizar e receber feedback |
| Portos | Inspeção 40HC, navio 3D, ciclo STS, planejamento de cais | Inspecionar, movimentar e resolver missão |
| Segurança do Trabalho | EPIs, cenário de risco e rota segura | Identificar, escolher e justificar |
| Enfermagem | Anatomia 3D, instrumentos, higiene, classificação de estruturas | Rotacionar, selecionar, organizar |
| Administração | Planilha didática de estoque, orçamento e gráficos | Tocar células, editar dados e observar resultado |
| Desenvolvimento de Sistemas | Cubos/voxel, lógica, blocos, terminal demonstrativo | Construir, programar, depurar |
| Educação Ambiental/Bioeconomia | Reciclagem, ecossistemas, cadeia produtiva, impacto | Arrastar, escolher e comparar indicadores |

## Imagens, texturas e realismo

- Arte e textura devem ajudar a identificar o objeto: metais, plástico, concreto, borracha, madeira, rocha e água, com materiais físicos plausíveis. Não transformar cada cartão em um degradê com glow.
- Aproveitar GLB LOD e mapas PBR (base color, normal, roughness) quando disponíveis e adequados.
- Selecionar assets **por experiência**, nunca copiar toda a pasta de um repositório.
- No modo ECO, reduzir resolução de render, geometria, sombras e textura; no modo BALANCEADO, habilitar materiais essenciais; ALTO só após medição real de FPS.
- Sem cenários inteiros e vários WebGL ativos ao mesmo tempo; cada módulo libera GPU, eventos, áudio e temporizadores na saída.
- O 4K físico não equivale à resolução CSS. Medir DPR e viewport no Android 14 antes de fixar dimensões.

## Garantias e pendências

- Repositórios públicos são consultáveis, mas isso **não implica** que todos os assets de terceiros estejam licenciados para republicação; auditar origem e arquivos vendorizados antes de copiar.
- O repo principal gb-eli/touch está privado, enquanto o site publicado é público.
- O repo gb-eli/LAB-MEIO-AMBIENTE-3D retornou 404.
- O piano completo e corte de frutas ainda não foram encontrados como módulos prontos nessas fontes; serão implementações próprias.
- Esta documentação não altera produção, dados, RLS, permissões ou publicação do GitHub Pages.

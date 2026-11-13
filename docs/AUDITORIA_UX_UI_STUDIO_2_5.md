# Auditoria UX/UI — TV TOUCH AGV
Data: 13/11/2026 | versão analisada: Studio 2.2 na main + captura mobile enviada pelo responsável.
Estado: revisão visual 2.5 em branch; **sem publicação e sem ensaio físico na Samsung WA86F**.

## Resumo da avaliação
A interface usa linguagem de sites de catálogo, com excesso de pequenos cartões repetidos e poucos elementos que demonstrem a ação real da experiência. Na captura do celular, a grade de duas colunas torna os títulos e textos pequenos, e sete destinos ficam comprimidos no dock fixo. Há uma divergência de conteúdo: a seção chamada "Vídeos 360°" apresenta oito pesquisas no YouTube, não vídeos 360 homologados. A paleta predominante é cinza-esverdeada; não diferencia bem tarefas, botões, estados e tipos de experiência.

Não basta "trocar cores": o problema envolve hierarquia, densidade, tipografia, conteúdo, navegação e regras de layout.

### Problemas por criticidade e intervenção

| Gravidade | Área | Diagnóstico verificável | Ação na PR 2.5 | Próximo critério de aceite |
|---|---|---|---|---|
| Crítica | Mobile | Dois cards por linha em viewport estreito da captura; descrições e chips encolhem | Grade 1 coluna até 780px; tipografia mínima revisada | Captura em 360/390/430 CSS px sem corte |
| Crítica | 360° | 8 itens em VIDEOS geram URLs de pesquisa do YouTube, não player/URL verificado | "Descoberta imersiva" e rótulo busca orientada; ações separadas | Curadoria e vídeo testado com toque na WA86F |
| Alta | Imagens | Ícone genérico em cartão e nenhuma prévia de vídeo com origem comprovada | 8 artes temáticas locais em sprite SVG, rotuladas como ilustração, NÃO miniatura | Trocar por capas fotográficas reais somente com autorização/proveniência |
| Alta | Navegação | 7 destinos no dock de celular, legendas pequenas | 5 destinos até 600px, "Mais" com Favoritos, Guia, Diagnóstico | Testar alcance do polegar e estados da rota |
| Alta | Hierarquia | Título, aviso azul largo, cartões e CTAs repetidos sem orientação de tarefa | Hero editorial, filtros funcionais, CTA "Pesquisar" versus "Roteiro da aula" e aviso compacto após o catálogo | Acessibilidade e leitura a 2–4 m |
| Alta | CSS | estilos.css, studio.css e identity.css com sobreposições e breakpoints concorrentes; UX legado ainda existe no repo | Camada funcional product-interface.css isolada para a revisão, sem excluir o legado no mesmo PR | Consolidar tokens e componentes depois de regressão visual |
| Alta | Cores | Aproximações pastel de verde/azul e contraste de rótulos inconsistente | Grafite/carvão neutro, azul petróleo para imersão e âmbar para ação principal; temas Claro/Vivo existentes | Medir contraste WCAG nas três paletas |
| Alta | Tipografia | Rótulos 10–11px e texto auxiliar 13px do CSS base | Corpo 16px na biblioteca mobile e escala progressiva; botões touch >= 48px | Medir zoom e escala do navegador Android |
| Alta | Ergon. TV | Home personalizada para paisagem, mas biblioteca ainda usa cards de app | Cards mais largos e botão grande; desktop em 3 colunas, tablet em 2, celular em 1 | Medir viewport CSS efetivo da WA86F (não presumir 3840 CSS px) |
| Média | Animações | Transições decorativas sem relação com resultado de jogo | Microtransições leves de CTA/foco, reduzidas sob prefers-reduced-motion | Motion depois: sucesso/erro, arrastar, encaixar, orbitar e reduzir carga |
| Média | Admin | Login e indicadores revisados na 2.2; precisa teste independente e nomenclatura consistente | Não alterado neste PR para evitar risco de permissões | Revisão dedicada de admin e estado "prévia fictícia" |
| Média | Assets | Fonts/ícones/capas sem pipeline semântico de origem e licença | Capas SVG próprias, cache local e nenhuma CDN adicional | Especificação de fotos WebP/AVIF e fontes autorizadas |
| Média | Manutenção | app.js concentra rotas, recursos, vídeos, desenho, quiz e sólidos | Filtro/renderer adicional isolado por funções; não refatorado globalmente | Separar vídeo/library e experiences por contrato modular |
| Média | Cache | SW antigo com versão que pode servir arquivos obsoletos | Novo cache 2.5 e sprite local incluído | Teste real de atualização do PWA e hard reload |

## Sistema cromático proposto

**A cor deve expressar função, não decoração.**
- Dark/Black: fundo #0C1115, superfície #151F23, texto #F9FBF7. Aparência técnica, não "fundo preto com neon".
- Claro: fundo #F4F4F0, texto #172A30. Contraste editorial alto e luz neutra.
- Vivo: fundo #10232C, superfície #142A36, texto #FBFCF6. Oscilação cromática já existente fica como plano de fundo, com leitura estável.
- Ação primária: âmbar #F2B84B, sobre azul/grafite; não utilizar âmbar em todos os elementos.
- Portos: azuis industriais e laranja de carga; Natureza: verdes profundos; Ciência: azuis; Cultura: terracota; Tecnologia: grafite.
- Sem borda decorativa colorida ou chips fluorescentes em todos os cards.
- Os pares de tokens principais de texto e CTA foram medidos em JavaScript e passam 4,5:1 nos três temas. A auditoria completa de contraste em todos os componentes ainda exige navegador/ferramenta apropriada.

## Diretriz responsiva

**Celular (até 600 px CSS)**: navegação fixa com cinco destinos, controles no header compactos, cards 1 coluna, 16px para corpo, CTAs amplos, safe-area abaixo do dock e rolagem vertical natural.

**Tablet (601–1399 CSS px)**: grid de vídeos em 2 colunas, filtros roláveis em viewport estreito, header sem saturação de controles, uso de toque e teclado.

**TV/desktop em paisagem (a partir de 1400 CSS px)**: três cards grandes com capa 16:9, hero de exploração, texto legível a distância, ações separadas e estado ativo óbvio. Configurações de tema não devem tirar espaço das atividades.

**Viewport extra amplo (2200+ CSS px)**: escalar controles, fontes e dock. **4K físico da WA86F não informa o valor CSS**; confirmar devicePixelRatio e viewport usando Diagnóstico.

Pontos de auditoria de tela: 360x780, 390x844, 430x932, 768x1024, 1024x768, 1366x768, 1600x900, 1920x1080, viewport real WA86F em tela cheia. Testar modo retrato mobile e paisagem da TV.

## Diretriz fotográfica e de vídeo

A PR cria **oito artes temáticas locais** (porto, navio, oceano, história, espaço, museu, floresta e indústria), com ilustração reconhecível no lugar de ícone genérico. Elas são arte editorial, não fotos e não miniaturas reais de vídeos.

Não atribuir uma foto à descoberta de um vídeo que não está verificado. O estado futuro esperado de cada registro:
- link do vídeo e URL da fonte oficial;
- prova funcional de panorama 360 no navegador alvo;
- capa do próprio vídeo (quando licença/API permitir) ou fotografia contextual licenciada;
- autor/fonte/licença/crédito, duração, idioma, faixa etária, edição/revisão;
- renderização WebP/AVIF otimizada e fallback SVG local;
- aviso de conteúdo intenso e autorização institucional quando aplicável;
- cache offline apenas de assets próprios, **não do YouTube**.

A ausência de vídeo curado não é uma desculpa para inventar links ou fotos. A issue #13 continua sendo o caminho de curadoria real.

## Interação e movimento

- 120–180ms para resposta de botão, tecla e seleção; 180–260ms para transição de cartão/modo; até 400ms para entrar numa experiência (não contar tempo de rede).
- Animações relacionadas à tarefa: física do objeto, encaixe, gesto, feedback de progresso e conclusão. Evitar "glow contínuo", estrelas decorativas e loops pesados.
- Reações devem funcionar com mouse, caneta, dedo, 2 dedos e teclado quando pertinente.
- Respeitar prefers-reduced-motion e pausa quando a janela estiver oculta.
- Não carregar modelos 3D ou Web Audio na lista inicial.

## Arquitetura CSS/JS: dívida técnica conhecida

Main 2.2 contém app.js extenso, styles.css legado fortemente compactado, studio.css para o launcher e identity.css que sobrepõe estilos do launcher. ux-shell.css também existe no repositório, embora não conste da lista de <link> da página pública verificada. A nova camada product-interface.css é **passo controlado**, não refatoração concluída.

A arquitetura ideal das próximas PRs:
- base/tokens.css: paleta, escalas, tipografia, z-index, movimento;
- base/layout.css: shell, dock, header e breakpoints;
- components/cards.css, buttons.css, dialogs.css, filters.css;
- pages/discovery.css, pages/lab.css, pages/diagnostics.css;
- experiences/ com estilos encapsulados e lifecycle próprio;
- app.js como inicializador e roteador, catalog.js como provedor de dados e renderização;
- tests/ com snapshots, contraste, touch e limites de viewport.

**Não substituir os arquivos antigos às cegas:** migrar seção por seção com análise de regressão de biblioteca, tutorial, desenho, 3D, memória, física, temas e administração.

## Execução e testes nesta etapa

- Arquivos públicos alterados: index.html, app.js, service-worker.js.
- Arquivos novos: product-interface.css, immersive-scenes.svg.
- Testes novos: tests/ux-video-discovery.test.cjs (5 casos; sem npm).
- 8 temas representados; filtros Todos/Portos/Natureza/Ciência/Cultura/Tecnologia.
- Rota Mais não substitui rotas existentes: apenas agrupa 3 destinos no celular.
- Novo cache PWA com CSS/sprite incluídos.

**Limites de validação:** testes de lógica executados com JavaScript/DOM simulados. Não há captura visual independente do navegador neste ciclo. Homologação na Samsung WA86F, screenshots e contraste WCAG permanecem **NO-GO** antes do merge/publicação.

## Roadmap de correção

1. PR 2.5: arquitetura da descoberta 360, mobile, contraste de base, navegação, linguagem semântica.
2. PR 2.6: fontes e fotos licenciadas, catálogo de vídeo efetivamente curado, SEO/miniaturas e fallback offline.
3. PR 2.7: consolidação CSS (redução de sobreposições) e componente único de cartão para recursos não-imersivos.
4. PR 2.8: motion integrado às atividades e instrumentação de FPS, limiar mínimo de toque e tempo de ação.
5. Integração com PRs #14 e #15 (piano e geometria) em ordem controlada e com rebase, sem perda de alterações.

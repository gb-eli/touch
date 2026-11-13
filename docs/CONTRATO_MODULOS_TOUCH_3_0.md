# TV TOUCH 3.0 — Contrato de módulos, gestos, gráficos e missões

## 1. Arquitetura do portal unificado

O portal público continua HTML/CSS/JavaScript estático no GitHub Pages. O shell apenas mostra catálogo e inicia uma experiência isolada. Cada jogo tem seu próprio código, assets, acessibilidade, ciclo de vida e limites de performance.

Estrutura proposta:

    public/
      index.html
      assets/
      css/
      js/
        app.js
        governance.js
        touch-input.js             (novo, biblioteca de gestos)
        experience-host.js         (novo, controle de ciclo de vida)
        graphics-quality.js        (novo, qualidade adaptativa)
        experience-events.js       (novo, eventos e consentimento)
      experiences/
        manifest.json              (somente experiências homologadas)
        piano-touch/
          index.js
          style.css
        solids-match/
          index.js
          style.css
        container-inspection/
          index.js
          assets/                  (somente arquivos necessários)
      admin.html

**Importante:** docs/candidatos-touch-3.0.json é um arquivo de planejamento, não o manifest de produção. A UI não deve oferecer um módulo ainda não implementado.

### Manifesto da experiência (proposta de campos)

- id, version, title, shortDescription, domain, subjects[]
- interaction: tap / drag / rotate / pinch / multi-touch / play-audio
- durationMinutes, minimumAge, ageRating, teacherNotes, learningObjective
- iconSvg, previewImage, accentColor; materialTheme só se necessário
- entry, styles[], assets[], offline, estimatedDownloadBytes
- graphics: canvas2d / webgl / fallback2d, qualityMin, qualityMax
- source: repository + commit + paths + direitos revisados
- flags: needsAudio, needsInternet, publicEnabled, administratorControlled
- status: tested / homologated (não aceitar campo marketing como sinônimo de validação)

### Interface obrigatória no JavaScript

- mount(context) => Promise<void>: cria somente a UI e renderizador da experiência;
- pause(): pausa simulação, áudio e animações quando invisível ou ao abrir diálogo;
- resume(): volta ao estado anterior após solicitação explícita, se aplicável;
- unmount(): Promise<void>: elimina nós próprios, listeners, observadores, animações, audioNodes, WebGL textures/geometries e timers;
- optional reset(): reinicia missão sem recarregar toda a página.

Contexto oferecido pelo host:
- root: contêiner exclusivo;
- controls: adaptador Pointer Events;
- graphics: qualidade e medidor de quadros;
- audio: contexto com desbloqueio por gesto, volume mestre e mute;
- events: mission:start, mission:progress, mission:complete, resource:error;
- storage: namespace do módulo (somente dados locais não sensíveis);
- display: modo 16:9, viewport, canvas pixel ratio e tela cheia;
- localization/locale: português BR;
- signal: AbortSignal encerrado ao sair.

Não misturar o state de uma experiência com IDs globais do admin. Não adicionar listeners no document que sobrevivam ao unmount.

## 2. Gestos para a WA86F (TV como telefone horizontal gigante)

O usuário vai tocar em locais diferentes da tela, possivelmente com várias mãos. Não projetar interface baseada em mouse hover.

| Gesto | Uso | Alternativa acessível |
|---|---|---|
| Um toque curto | Selecionar peça/hotspot, apertar tecla do piano | Enter/Espaço ou botão dedicado |
| Arrastar um dedo | Girar objeto, mover peça, desenhar, cortar fruta | Botões de girar/mover ou selecionar destino |
| Pinça com dois dedos | Zoom de câmera 3D/360 | Botões + e −, reset câmera |
| Dois ou mais contatos | Acordes no piano e ações cooperativas quando suportadas | Reprodução sequencial ou controles individuais |
| Toque prolongado | Informação ou dica contextual | Botão de ajuda explícito |
| Arraste na borda | Não disparar navegação involuntária | Navegação sempre por botão voltar |

Usar Pointer Events por pointerId, Map de contatos ativos, setPointerCapture quando adequado, e pointercancel/visibilitychange para limpar estado. Definir touch-action:none SOMENTE nas superfícies de gesto (canvas e quadros), mantendo scroll e navegação normais em listas.

Heurísticas a homologar, não fixar sem teste:
- toque alvo 64 a 80 CSS px ou maior;
- arraste só após deslocamento de 8–14 CSS px;
- evitar disparar clique depois de um drag;
- não depender de detecção de 40 contatos no navegador; testar 2, 3, 5 e 10 contatos na TV;
- multitouch com mais de uma pessoa deve ignorar pressão/gestos fantasmas e pointercancel.

## 3. Renderização e qualidade gráfica

### Perfil ECO
- Primeiro frame rápido, LOD reduzido e sombra simplificada/ausente;
- DPR de render limitado; texturas essenciais reduzidas;
- quando WebGL falha: Canvas 2D com controles e missões preservados.

### Perfil BALANCEADO
- Materiais PBR moderados, iluminação direcional, geometria selecionada;
- textura normal/roughness somente se melhora leitura do objeto;
- 3D sob demanda e descarte ao sair.

### Perfil ALTO
- LOD e texturas superiores, sombras adequadas ao objetivo, antialiasing conforme FPS;
- habilitar somente após medição de recursos. Não confundir “TV 4K” com GPU potente.

O GraphicsQualityManager mede frame-time, FPS e falhas. Deve poder trocar perfil, reduzir resolutionScale e registrar se fallback foi necessário. O portal nunca pode entrar em loop infinito de restarts após webglcontextlost. Usar Page Visibility para suspender animação e evitar aquecimento e consumo.

Critérios iniciais de aceitação (calibrar após observação real):
- UI reage perceptivelmente no primeiro contato, sem duplo clique;
- abrir e sair da experiência 10 vezes sem multiplicar listeners, WebGL contexts ou timers;
- sessão de 10 minutos sem queda progressiva pronunciada de FPS;
- touch e texto legíveis em 1366×768, 1600×900, 1920×1080 e viewport efetivo da WA86F;
- foco visível, contraste e preferência prefers-reduced-motion.

## 4. Modelo de missão pedagógica

Toda experiência planejada tem:
1. **Objetivo (até 15 s):** uma frase, sem teoria longa;
2. **Interação:** experimentar com dedo/caneta e observar reação;
3. **Desafio:** uma meta verificável com feedback imediato;
4. **Conclusão:** resultado e convite a testar outra variável;
5. **Nova rodada:** reiniciar sem recarregar a aplicação.

Exemplos:
- Piano: “Toque Dó–Mi–Sol simultaneamente”; feedback quando as três teclas forem acionadas;
- Frações: “Separe uma fruta em quatro partes iguais”;
- Xadrez: “Encontre uma jogada que dá xeque”;
- Navio: “Inspecione portas, lacre e canto superior do contêiner”;
- EPI: “Escolha a proteção correta para uma tarefa”;
- Anatomia: “Localize o sistema respiratório e nomeie as estruturas visíveis”;
- Física: “O que muda ao dobrar a frequência da onda?”

Modo equipe: duas pessoas no painel ou turnos de grupos. **Não registrar nomes de alunos, posições individuais de toque ou notas oficiais.**

## 5. Piano touch — requisitos do piloto

O piano será uma experiência original baseada em Web Audio, usando padrões já existentes no LABDS Audio Lab e em Ondas LAB Física. Não foi encontrado um piano multitoque completo pronto nos repositórios revisados.

- 12 teclas na introdução, depois 24, com tecla branca e preta em proporção física aproximada;
- voz independente por contato, ataque/release musical e polifonia mínima de 4 vozes; meta de 8 após teste;
- três timbres sintetizados sem samples externos;
- seletor de oitava, volume e silenciar;
- modo livre, repetir sequência de notas e construir acorde;
- efeitos visuais de pressão por tecla, sem brilho permanente;
- iniciar AudioContext somente após toque, parar notas em pointerup, pointercancel, visibilitychange e unmount;
- se o som não estiver disponível, ainda mostrar visualmente a nota e oferecer atividade rítmica silenciosa;
- composições próprias ou domínio público; não incorporar melodias comerciais sem direitos.

## 6. Separação entre portal e administração

A rota pública não exige login. Administradores podem posteriormente liberar/desabilitar módulos e selecionar perfil gráfico por TV usando Supabase, quando devidamente configurado.

- A capacidade de desativar ferramenta não equivale a ocultar informações privadas por JavaScript; permissões reais exigem banco e políticas corretas.
- Métricas são voluntárias e agregadas: abertura de módulo, duração aproximada, erros, perfil gráfico, FPS e uso por TV identificada como 01/02/03.
- Nunca incluir MAC de rede, senha Wi-Fi, dados de estudantes ou identificadores sensíveis nos logs.
- Persistir pontuação apenas localmente, e somente agregados educacionais mediante escolha explícita.

## 7. Publicação e controle de tamanho

- Repositórios de origem devem ser fixados por commit SHA; registrar diretórios importados, licença, autoria e eventual bibliotecas third-party.
- Copiar apenas os assets essenciais em resolutions/LOD apropriados; não importar sistemas completos.
- Não carregar Three.js globalmente na página inicial: import dinâmico por necessidade e compartilhamento de versão em um vendor local aprovado.
- Não adicionar um service worker gigante com todos os GLBs. Cache offline seletivo por experiência, informando o tamanho antes de disponibilizar pacote de grande porte.
- GitHub Pages continua uma saída estática; evitar workflows personalizados e publicar uma única vez depois de QA, conforme preferência de custos do projeto.

## 8. Critérios de saída de cada PR de experiência

Toda PR deve ter: relatório de fontes e licenças, teste Pointer Events, teste touch em landscape, screenshot da home e da experiência, teste WebGL loss/fallback, teste sair/reabrir, avaliação de CPU/memória/FPS, acessibilidade, no-network e rollback. Componentes de demo devem ser marcados claramente e não podem aparecer no catálogo como “homologados”.

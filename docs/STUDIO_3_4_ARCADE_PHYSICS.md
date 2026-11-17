# AGV TOUCH Studio 3.4 — Física visual e qualidade de interação

## Escopo executado

- **Basquete:** lançamento com velocidade limitada, gravidade, rebote no aro e piso, pontuação apenas ao atravessar o centro do aro na descida. Aro não é uma barra fechada; o desenho corresponde à regra. Guia de trajetória e força acompanham o arraste, calculadas com passo determinístico de 1/120 s.
- **Sinuca:** simulação 2D com subpassos temporais (até oito), colisões com transferência de momento, atrito, seis caçapas e reposição segura da bola branca. Indicador de força, orientação de taco e linha de previsão para a primeira bola ou limite de alcance.
- **Oficina de blocos:** animação apenas para o último bloco inserido/movido, contorno das colunas disponíveis e limite de seis blocos, sem reiniciar animações em toda a construção. Foco de teclado preservado após atualização do DOM.
- **Performance:** renderização Canvas de Arcade continua adaptativa, respeitando limite de 3840×2160 pixels do buffer. Não foram adicionados efeitos de pós-processamento em tela inteira.
- **Acessibilidade:** as novas animações de blocos são eliminadas em `prefers-reduced-motion` e no modo de efeitos reduzidos. Sons continuam desligados até toque explícito; sem login ou armazenamento de pontuações.

## Arquitetura

`public/js/arcade-physics.js` expõe funções puras por `window.AGVArcadePhysics`, sem dependências de DOM, Canvas ou rede. Pode ser testado isoladamente no Node. O renderizador `public/js/arcade.js` consome as funções e aplica os efeitos, sem interferir no restante do portal.

`public/css/agv34-interactions.css` só é carregado nas páginas Arcade e Oficina. A build PWA inclui e versiona os arquivos.

## Limites explícitos

A simulação continua **2D**, com apresentação visual de relevo. Não é um motor físico 3D, nem sinuca profissional com efeitos de rotação/spin. A previsão da sinuca mostra a **primeira colisão**, não todas as trajetórias futuras. A construção continua com oito colunas; blocos verdadeiramente posicionáveis nos três eixos estão planejados na issue #27.

## QA obrigatório

- Testes Node de arremesso, pontuação, colisão de aro, rebote, caçapa, colisões de bolas, reposição da branca e guia de tacada.
- Smoke Chrome em 390×844, 1920×1080 e 3840×2160. Basquete com arraste e contagem de tentativas, Sinuca renderizada, bloco com animação local, sem erro de JavaScript ou overflow.
- Capturas por tela no artefato do GitHub Actions.
- Teste físico na Samsung WA86F: caneta, multitoque, latência, resposta do arraste, quadro médio FPS, aquecimento/memória após dez minutos (pendente até execução no equipamento).

## A partir da Studio 3.5

Construção volumétrica real com câmera, posições X/Y/Z, materiais originais, física de encaixe e fallback em Canvas. Testar qualidade e desempenho no Android do painel antes de expandir texturas e complexidade.

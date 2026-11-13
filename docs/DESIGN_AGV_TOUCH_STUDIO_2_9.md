# AGV TOUCH Studio 2.9 — Identidade visual unificada

## Referência e marca
Imagem de referência: mente/sinapse cristalina em fundo preto, triangulação facetada, reflexos em azul/ciano, coral e violeta, luz e partículas conectadas.
Marca principal: AGV TOUCH. Legado e URL do TV TOUCH preservados.

## Sistema visual
- Crédito discreto e persistente no canto inferior direito: Desenvolvido por Gabriel Elienai (9–12px).
- Abertura: título AGV TOUCH., botão COMEÇAR AGORA que dispara áudio mediante toque, segundo botão ENTRAR NO PORTAL.
- Uma arte vetorial original em SVG cria os prismas. Não incorpora nem extrai imagens ou vídeo de terceiros.
- Camada geral: SVG cristalino e Canvas de conexões sinápticas, microfacetas e partículas em resposta a interações.
- Portal, jogos e administração compartilham gradientes de preto, coral, violeta e ciano; preservam lógica e conteúdo das atividades.
- Navegação: transição breve entre páginas. A opção de redução de movimento e Save-Data são respeitadas.

## Performance
- Canvas ambiental limitado a 2.073.600 pixels e DPR de até 1,4.
- Frequência global ~30fps; ~11fps no Arcade. Menos partículas no mobile.
- Processamento pausado em aba oculta. Efeitos com pointer-events:none.
- Canvas 4K dos minijogos continua inalterado.

## Trilha sonora
O som sintetizado original começa no botão COMEÇAR AGORA. Áudio local opcional é reproduzido no próprio navegador e analisado pelo Web Audio AnalyserNode. Não há player de vídeo nem MP3 Dolby incorporado na produção. Direitos de redistribuição da gravação dependem de autorização.

## QA manual pendente — Samsung WA86F
1. Abrir sessão nova e verificar abertura, crédito, som, alvos e três controles de resultado.
2. Testar dedos e caneta na área inteira da tela, com multitoque quando aplicável.
3. Conferir home, laboratório, experiências, Arcade e administração em resolução real da TV, sem sobreposição.
4. Abrir os quatro minijogos e manter uso por dez minutos em alta definição, medindo FPS e memória.
5. Testar paletas de interface, fullscreen, acessibilidade e páginas após atualização do Service Worker.
6. Testar mobile 360/390/430 px, landscape 1920 px, 4K e modo offline após primeiro acesso.

O código foi verificado por inspeções estáticas e simulação; homologação física ainda necessária.

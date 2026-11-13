# TV TOUCH — Studio 2.6: experiência e Arcade (piloto)

## Estado
Branch feat/studio-2-6-experience-arcade. Proposta em rascunho. Não publicar em main nem gh-pages antes de homologação. A versão publicada segue Studio 2.2; PRs #14, #15 e #16 continuam separadas.

## Fluxo de abertura
- Primeira visita da sessão: botão "Iniciar experiência" e opção "Entrar sem testar". Preferência de sessão gravada apenas no navegador.
- Botão ativa player OFICIAL do YouTube para Dolby Atmos: Unfold, ID HZS5a3cm7zU; iframe visível com mínimo de 200×200 CSS px; pode precisar de segundo toque para reproduzir.
- Não extrai nem baixa áudio de terceiros; é um trailer audiovisual, não arquivo MP3. Precisa de internet e incorporação autorizada pelo vídeo/rede.
- Teste de toque com quatro alvos, posição aleatória, temas sorteados (frutas, esportes, formas), duração máxima aproximadamente 5,2 s. Oferece pular/repetir e mostra tempo médio de reação + total de acertos.
- A verificação mede interação e tempo humano na interface, NÃO calibra o digitalizador/firmware ou mede latência física.
- Os resultados não são persistidos nem enviados. Não há dados pessoais.
- Atalhos "Arcade" e "Testar toques" na home; tutorial antigo não aparece sobre a abertura.

## Arcade
- Snake: setas, gesto de deslizar, colisões, crescimento da cobra e frutas.
- Pong: raquete com dedo/setas, CPU, pontuação até cinco.
- Basquete: gesto de arrastar para arremessar, trajetória, gravidade e placar.
- Sinuca: 10 bolas coloridas, bola branca, seis caçapas, colisões e amortecimento simplificados.
- Botões Jogar/Pausar, Reiniciar, Tela cheia; alternância de estilo 2D/3D durante a partida; modo salvo localmente.
- O 3D é apenas VISUAL (sombras e relevo); a lógica de colisões, física e coordenadas continua em 2D. Não é engine física tridimensional.
- Sem login, sem placar público, sem dados escolares e sem integração nova com banco.

## Compatibilidade e QA
- HTML/CSS/JS estático, Canvas 2D, JavaScript sem bibliotecas externas. Rota arcade.html independente.
- Cache PWA inclui arcade e assets; fallback offline prioriza a rota exata em cache.
- Quatro arquivos JS compilados sem erros de sintaxe; IDs do Arcade exclusivos; 17 verificações estáticas/interativas com DOM e Canvas simulados passaram. Não é certificação de navegador real.
- Renderização suspensa quando não há partida e ao mudar a aba.

## Pendências de homologação — NO-GO
- Testar em Samsung WA86F Android 14 real, resoluções CSS efetivas, caneta e múltiplos toques.
- Verificar que o player embutido reproduz o vídeo indicado na rede da escola, e que a sua área não cobre os alvos.
- Confirmar compatibilidade com política de áudio e, se o vídeo for bloqueado, trocar por áudio original/autorizado como ativo local.
- Testar visual e uso em 360/390/430/768/1366/1920 CSS px, bem como 4K.
- Medir FPS, memória, uso de CPU e comportamento após 10 min em cada jogo.
- Testar teclado, leitores de tela, cache offline e atualização do service worker.
- Integrar com cuidado as PRs #14/#15/#16 que também modificam index e arquivos de interface.
- Um motor de física 3D real é uma etapa futura separada, dependente de desempenho da TV.

## Roteiro de teste manual
Abrir o portal com sessão limpa; clicar em Iniciar experiência; verificar player visível; tocar nos quatro alvos; entrar no portal; abrir Arcade; jogar as quatro modalidades; alternar 2D/3D durante a partida; pausar, reiniciar, fullscreen e voltar. Repetir sem rede após o site ter sido cacheado (a reprodução do YouTube não funcionará offline).

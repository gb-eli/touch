# TV TOUCH Studio 2.8 — Abertura cinematográfica com análise espectral

## Objetivo
Redesenhar a primeira experiência após avaliação visual mobile em 13/11/2026, removendo a janela de vídeo que cobria botões e corrigindo a contagem automática de 5,2 s que frequentemente terminava em 0/4.

## Direção visual
- Preto quase absoluto (#07050b), coral elétrico (#ff551d), violeta saturado (#a13bff) e texto branco de alto contraste.
- Tipografia editorial de peso alto, conteúdo alinhado à esquerda, CTAs grandes, composição gráfica de anéis e barras.
- Nenhum player de vídeo, iframe do YouTube ou arquivo MP3 de terceiro incorporado à distribuição.
- Responsividade em até 700px, entre 701 e 1100px, e em paisagem com baixa altura.
- Canvas decorativo limitado a aproximadamente 30 FPS e densidade máxima de pixels 2 para preservar desempenho do painel.

## Som e sincronismo
- Botão ATIVAR SOM produz uma trilha sintetizada original pelo Web Audio API. Tem progressão e impulsos programados; não é uma cópia do áudio Dolby.
- Botão ÁUDIO LOCAL usa a File API do próprio navegador para reproduzir um arquivo local selecionado pelo usuário, sem enviar o arquivo a servidores ou armazená-lo.
- O visualizador obtém o espectro da fonte ativa via AnalyserNode: graves (30–190 Hz), médios (190–1800 Hz) e agudos (1800–7000 Hz).
- O envelope de energia altera raio do pulso, luminosidade do núcleo e comprimento das barras.
- O arquivo Dolby Atmos Unfold fornecido para análise possui duração de aproximadamente 27,19 s. Pulsos fortes por volta de 5,35; 7,05; 10,95; 12,99; 15,24; 16,94; 18,94; 20,34; 21,14 e 21,94 s inspiraram somente a temporização da trilha sintetizada original.
- Reprodução de arquivo MP3 Dolby em distribuição pública requer direitos de utilização e redistribuição; o arquivo **não foi incluído** na branch.

## Fluxo e UX
- Abertura aparece uma vez por sessão com a nova chave tvt:entry:v2; opção PULAR sempre acessível.
- A calibração usa quatro alvos e NÃO possui tempo de expiração, eliminando conclusão automática 0/4.
- Resultado fica na tela até o usuário tocar em Abrir TV TOUCH, Repetir ou Arcade; sem interpretações de defeito físico para teste não realizado.
- A verificação registra somente reação e quantidade durante a sessão, sem histórico e sem envio.
- Áudio e animação são interrompidos quando o portal é aberto.

## Verificações realizadas
- Sintaxe JS: PASS (experience-intro.js e service-worker.js).
- Checagem de ausência de iframe YouTube: PASS.
- API Web Audio + FFT e três bandas: PASS por inspeção.
- Compatibilidade do cache PWA 2.8.0: PASS por inspeção.
- Fluxo com DOM simulado: abrir, iniciar, quatro alvos, contagem, resultado, entrar no portal: PASS.
- Controle de renderização 30 FPS e responsividade: PASS por inspeção estática.

## Testes físicos ainda necessários
- Samsung WA86F / Android: Web Audio sintetizado e arquivo local com autorização de áudio.
- Qualidade de som, headset/alto-falante, volume inicial e visibilidade dos controles.
- Mobile 360/390/430 px e painel em 1920/3840 CSS/physical pixels.
- Abrir, pular, reiniciar e entrada no Arcade sem interferência do tutorial.
- Indicadores de CPU/memória e FPS durante no mínimo dez minutos.
- Preferência de movimento reduzido, teclado, leitores de tela e retorno ao portal.

# TV TOUCH 3.0 — Curadoria da biblioteca de vídeos 360°

## Problema atual
Em public/js/app.js, os itens de Vídeos 360° usam youtubeSearch(...) e abrem a página de resultados de pesquisa. Pesquisa não significa vídeo 360 verificado. A partir do TV TOUCH 3.0, o catálogo exibirá somente vídeos aprovados individualmente.

## Organização visual
- Tela em orientação horizontal com cartões grandes (prévia real, título, assunto, duração e fonte).
- Barra de temas: Natureza; Viagens e lugares; Portos e navios; Ciência e espaço; História e patrimônio; Artes e museus; Aventura; Suspense/Terror (restrito).
- Filtros de verdade: área curricular, duração, faixa etária recomendada, idioma/narração, conteúdo verificado, fornecedor.
- Distintivos funcionais, não decorativos: “360° verificado”, “Necessita Internet”, “Sem narração”, “Atenção: conteúdo intenso”, “Incompatível com o navegador”, “Não disponível”.
- Seção “Preparar a aula”: 3–5 vídeos aprovados, com roteiro de observação. Não puxar resultados dinâmicos sem revisão docente.

## Registro de cada vídeo
- id, title, provider, providerUrl, videoUrl, canonicalVideoId;
- thumbnailUrl, durationSeconds, categories[], subjects[], tags[];
- verified360:boolean, browserPanTested:boolean, panelTested:boolean;
- verifiedAt (data), reviewer, locale, narration, recommendedMinAge, intensity, contentWarning[];
- publicEnabled:boolean, requiresNetwork:boolean, embeddingAllowed:boolean;
- learningGoal, promptBefore, promptAfter;
- status: awaiting-review / approved / unavailable / rejected.

Não criar vídeos de exemplo como se fossem conteúdo real. Um registro só pode entrar em lista pública quando status=approved e verificação 360 executada.

## Verificação obrigatória
1. Abrir fonte oficial em navegador Chromium/Android.
2. Confirmar que o vídeo é esférico 360 ou 180/VR, não apenas um vídeo plano com título “360”.
3. Verificar que arrastar com dedo muda o ângulo e que o vídeo permanece utilizável sem mouse.
4. Conferir duração, faixa etária, idioma, anúncios, ausência de conteúdo impróprio para o uso pretendido, país/disponibilidade e URL estável.
5. Verificar autorização de incorporação/embedding; quando indisponível, abrir a página do proprietário em nova aba claramente identificada.
6. Registrar último teste e retirar automaticamente de recomendações itens indisponíveis.
7. Indicar “Online” (vídeos externos não são prometidos como offline).

## Curadoria para disciplinas
- Geografia: cidades, relevo, oceanos, fenômenos naturais, viagens.
- História: visitas a sítios e museus, patrimônio cultural, reconstruções com identificação de ficção.
- Ciências/Química/Física: laboratórios e experiências seguras, estações espaciais, planetas, ambientes subaquáticos.
- Portos: passadiço de navio, convés, terminal, pátio, equipamentos e operação de cais.
- Artes: exposições, esculturas, espaços culturais e arquitetura.
- Aventura: percursos imersivos, esportes com risco controlado e passeios temáticos.
- Suspense/Terror: **não aparece como sugestão padrão escolar**. Depende de revisão docente, intensidade/idade, avisos e autorização institucional adequada; evitar jumpscares inesperados ou autoplay.
- Segurança do Trabalho: tour de cenários reais com identificação de risco, sem instruções perigosas.
- Enfermagem: hospitais e anatomia 360 somente de fontes apropriadas e classificadas para ensino.

## Interface de reprodução
- Abrir com prévia e botões “Assistir”, “Voltar”, “Ver roteiro”.
- Quando o provedor permitir incorporação funcional na WA86F, usar viewer dentro de uma seção que maximize a área de panorama e preserve controles de pausa e saída.
- Priorizar entrada em fullscreen por gesto direto do usuário; alguns navegadores rejeitam fullscreen/autoplay automáticos.
- Sempre apresentar controle de volume e legenda quando disponível; som desativado por padrão quando abrir apenas prévia.
- Adaptar o gesto pan/pinch; botão “Recentralizar” como alternativa. Em vídeos externos cuja API não suporte recentralização, não anunciar esse controle.
- Sem tela de “carregando” indefinidamente: mostrar erro, alternativa abrir fonte e “Voltar”.

## MVP
- Primeiro publicar **zero links inventados**. Curar manualmente 2–3 vídeos por tema selecionado.
- Primeira rodada recomendada: Natureza, Geografia e Portos, sem Suspense/Terror.
- O roteiro de aula é curto: observar 3 características, discutir 1 causa/efeito e registrar conclusão oralmente.
- Introduzir classificação administrativa por temática só depois de backend e políticas realmente configurados.

Nenhuma URL de vídeo foi aprovada nesta fase. A biblioteca atual de pesquisas do YouTube continua em produção até a substituição validada.

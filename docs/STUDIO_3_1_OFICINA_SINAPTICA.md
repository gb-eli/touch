# AGV TOUCH Studio 3.1 — Oficina Sináptica e texturas

## Direção de design
Referência: as capturas do Drive do AGV TOUCH e os quadros com cristais e conexões sinápticas inspirados no vídeo Dolby Atmos Unfold. O site utiliza arte prismática vetorial própria e CSS procedural. Nenhum quadro, vídeo ou MP3 de terceiros é redistribuído. Marca AGV TOUCH com crédito permanente “Desenvolvido por Gabriel Elienai”.

## Categorias e interações
A navegação geral, o laboratório e o Arcade levam à nova **Oficina Interativa**, sem login, com cinco atividades. A busca global passa a encontrar todos os novos jogos.

| Categoria | Jogo | Interação | Modos |
| --- | --- | --- | --- |
| Construção | Blocos texturizados | Tocar, selecionar e arrastar blocos para empilhar em 8 colunas × 6 alturas | Livre / desafio de alturas |
| Precisão | Conexões | Observar o padrão por 2,3 s e repetir traçando com dedo, caneta ou tocando nos pontos | Sequências aleatórias de 4 a 6 pontos |
| Estratégia | Jogo da velha | Escolher casa, aguardar resposta e ver linha vencedora animada | 2 pessoas no mesmo painel / CPU com estratégia variável |
| Estratégia | Damas | Mover diagonalmente, capturar obrigatoriamente, promover dama, encadear capturas | 2 pessoas no mesmo painel / CPU com decisões variadas |
| Imagem | Quebra-cabeça | Selecionar duas peças para trocar; importar JPG, PNG ou WebP do dispositivo | 3×3 ou 4×4 |

Todos possuem reinício, status acessível, feedback visual e efeitos sonoros opcionais iniciados por gesto explícito. CPU não se apresenta como inteligência avançada; é oponente heurístico com variabilidade, podendo ganhar ou perder. Multiplayer é local na mesma tela, sem rede.

## Texturas
- **No construtor:** grama, terra, areia, pedra, lava, gelo, madeira, tijolo e cristal. CSS com gradientes e padrões procedurais; empilhamento, seleção da peça superior e movimentação entre colunas, sem imagens proprietárias do Minecraft.
- **Nos sólidos 3D:** 11 materiais ilustrativos: cerâmica, aço, madeira, pedra, gramado, areia, terra, lava, gelo, tijolos, cristal. Canvas2D com sombreamento, padrão de grão, rotação e zoom existentes. São projeções e texturas 2D sobre faces, não mundo 3D físico com colisão realista.
- Jogos existentes Snake, Pong, Basquete, Sinuca, Memória e Encaixe foram preservados.

## Fotos e privacidade
O quebra-cabeça usa por padrão o cristal SVG original da plataforma. Professores podem selecionar uma **fotografia própria** (JPG, PNG, WebP; até 12 MB), armazenada somente como URL temporário no navegador, sem upload, transmissão, telemetria ou armazenamento persistente. O arquivo é liberado ao sair da página ou trocar de fotografia.

## Identidade e responsividade
- Paleta global: preto/violeta/ciano/coral com transparências e partículas sinápticas.
- Jogos com animações de inserção, captura e conclusão; respeito a redução de movimento.
- Toque, caneta e mouse; teclas e seleção acessível por botões quando arrastar não é adequado.
- Ajustes específicos a partir das capturas de Chrome: barra contextual mobile condensada (evitando repetir título); navegação inferior sem sobrepor o crédito e conteúdo; cartões compactos.
- Canvas ambiental da Oficina/Arcade em até ~11 FPS, separado do renderizador dos jogos. Jogos antigos mantêm limite 4K adaptativo.

## QA e riscos
- Testes automatizados cobrindo velha, 165 combinações de texturas geométricas, damas, integração de navegação e cache.
- Imagens e texturas foram criadas como aproximação visual; não equivalem a fotografia/PBR nem a física de blocos real.
- **Pendente no equipamento físico Samsung WA86F:** FPS, pointer capture simultâneo, áudio liberado por gesto, arrastar com caneta, ajustes 16:9, leitura em 4K, foco e navegação por voz, cache offline após atualização.
- Acesso ao portal e aplicações existentes é preservado. Não modifica banco, autenticação, permissões ou registros escolares.

## Roteiro de homologação
1. Abrir AGV TOUCH em Android, celular e WA86F; clicar Começar agora, ouvir sound design original, repetir/pular os quatro pontos de teste.
2. Ir de Início → Oficina → Conexões. Traçar padrão por toque e arraste. Repetir com caneta.
3. Em Blocos, selecionar cada um dos nove materiais; adicionar à coluna, arrastar bloco superior para outra, desfazer, iniciar desafio.
4. Em Jogo da Velha, simular vitória X/O, empate e turno da CPU. Trocar para modo duas pessoas.
5. Em Damas, verificar capturas obrigatórias, múltiplas capturas, coroação e partida dupla/CPU.
6. No Quebra-cabeça, usar ilustração padrão e foto local 3×3/4×4, girar tela e reiniciar.
7. Voltar ao portal; verificar biblioteca, sólidos texturizados, piano multitoque, Arcade 4K e admin somente leitura.
8. Testar paisagem 1920×1080 e 3840×2160, mobile 360/390/430px, acessibilidade e redução de movimento; observar memória/FPS após 10 minutos.

# AGV TOUCH Studio 3.5 — Construção 3D com WebGL1

## Objetivo

Consolidar o laboratório de construção em três dimensões, preservando integralmente os **Blocos 2D** anteriores. A nova experiência fica na primeira opção da Oficina, sem login, com renderer local e texturas geradas proceduralmente.

## Implementação

- **Motor voxel:** `public/js/voxel-world.js` — grade de 8 × 8 células em X/Z, seis níveis Y, limite de 256 blocos por projeto, colisão de ocupação, encaixe a vizinhos, histórico de 40 alterações, desfazer/refazer, validação de entrada e raycast AABB.
- **Renderizador:** `public/js/voxel-renderer.js` — WebGL1 sem bibliotecas externas, perspectiva, z-buffer, iluminação direcional por face, remoção de faces internas, texturas próprias num atlas 512×512. Desenha somente sob demanda; orçamento do Canvas limitado a aproximadamente 3,2 megapixels. Controla perda/restauração de contexto WebGL.
- **Materiais originais:** grama, terra, areia, pedra, lava, gelo, madeira, tijolos e cristal; elementos procedurais, sem texturas da marca Minecraft ou LEGO.
- **Interação:** toque para colocar/remover, modo mover por toque de origem/destino ou arraste, um dedo para girar a câmera, pinça e controles para zoom, rotação e centralização. A seleção usa raycast contra faces e plano do chão, com encaixe em coordenadas inteiras.
- **Acessibilidade:** modo 2D de fallback sem WebGL, botões de câmera, teclado, seção de grade de 64 posições e avisos textuais. Nenhum áudio obrigatório, nenhum cadastro ou envio de projetos ao servidor.
- **Projetos locais:** botão Salvar grava exclusivamente o arranjo dos blocos em `localStorage`; Carregar lê somente o mesmo formato com validação. Sem autosave nem informações pessoais.
- **Missões:** construção livre, torre, escadaria, ponte e simetria. Objetivos e progresso são determinados por coordenadas exatas, com um mapa superior textual e visual.
- **Estilo:** identidade sináptica da Studio 3.2–3.4, com superfícies escuras, pontos cianos, seleção coral e alto contraste. Animações decorativas continuam sujeitas às configurações de movimento reduzido.

## Limites

É um **construtor de voxels 3D real**, não um motor de física de materiais: blocos colocados lateralmente não caem automaticamente e não há destruição por gravidade. A grade 3D e a visualização 2D são experiências separadas: não convertem automaticamente projetos entre si. A construção com formato semelhante a brinquedos de encaixe proprietários não é reproduzida. Em GPUs sem WebGL o sistema abre os blocos 2D existentes.

## Aceitação antes da produção

1. Testes unitários: validação XYZ, encaixes, missões, histórico, importação segura, picking 3D e materiais.
2. Testes Chrome real: WebGL funcional em 390, 1920 e 3840 pixels; criar, desfazer, refazer, salvar, carregar, concluir torre e retornar ao modo 2D.
3. Capacidade limitada do Canvas em 3,2 megapixels e sem erros JavaScript / overflow horizontal em qualquer perfil.
4. Capturas das telas nas resoluções anteriores, incluindo construtor em 3D.
5. Teste físico posterior na Samsung WA86F de 86 polegadas: pinça simultânea, rotação, caneta, seleção de blocos, memória e FPS ao longo de 10 minutos. **Não afirmar homologação física sem a TV.**

## Plano seguinte

Ampliar a grade somente após medição física, adicionar novos formatos (prismas, cilindros, rampas), modelos de aula e catálogo de projetos locais. Priorizar qualidade visual, fluidez e legibilidade em 4K antes de complexidade.

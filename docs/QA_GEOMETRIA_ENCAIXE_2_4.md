# TV TOUCH Studio 2.4 — Relatório QA (geometria + encaixe)

Data de revisão: 2026-11-13
Alvo: Samsung WA86F, 86", Android 14, paisagem.
Estado: **piloto em PR, não publicado nem homologado na WA86F**.

## Alterações
1. Cinco sólidos geométricos: cubo, prisma, pirâmide quadrangular, cilindro e esfera.
2. Renderização 3D projetada em Canvas 2D: luz difusa por normal da face, sombra, referências de espaço e materiais procedurais ilustrativos (cerâmica, aço escovado, madeira, pedra). **Não é PBR/WebGL, nem reproduz fielmente texturas fotográficas**.
3. Perfis ECO / Equilibrada / Detalhada, controlando resolução de Canvas e segmentos de malha.
4. Um dedo gira, dois aproximam, teclado físico funciona por setas +/−; rotação automática para ao sair, ocultar ou reiniciar.
5. Encaixe: níveis com 4, 6 e 8 peças; contagem de erros, dica, acesso por toque peça→slot, arraste com múltiplos pointerId, mensagens e evento de conclusão.
6. Uma única folha de CSS para as atividades, sem novas dependências, cadastro, banco ou bibliotecas copiadas de outros projetos.

## Testes de lógica executados
- Sintaxe validada com parser JavaScript para app.js e geometry-lab.js.
- 5 malhas × 3 perfis: índices válidos e contagem de faces estável.
- 5 sólidos × 3 perfis × 4 materiais = **60 combinações de renderização** executadas com um contexto Canvas 2D simulado.
- Limite de resolução: ECO ~0,9 MP, Equilibrada ~1,85 MP, Detalhada ~3,2 MP (tolerância de arredondamento ~0,5%).
- Jogo: progressão 4/6/8, correspondência correta, tentativa errada, proteção contra duplicação de conclusão.
- Dois drags simultâneos simulados, com limpeza dos fantasmas após soltar as peças.
- Total: **4/4 cenários automatizados de teste passaram**. Testes de DOM e Canvas são com mocks; não equivalem a ensaio físico.

Reprodução sem npm: \`node --test tests/geometry-activities.test.cjs\`.

## Testes pendentes para GO
- Testar na Samsung WA86F via toque/caneta: 1, 2, 3 e 5 contatos, pinça, arraste, cancelamento e toques simultâneos de duas pessoas.
- Conferir 1366×768, 1600×900, 1920×1080 e viewport CSS efetivo (4K físico não implica 4K de CSS).
- Medir FPS/frame time e memória em ECO, Equilibrada e Detalhada por 10 min; observar mudança de textura sem queda expressiva.
- Conferir contraste e botão selecionado nas três paletas (Black/Claro/Vivo), zoom com teclado e preferências de movimento reduzido.
- Comparar forma real de cilindro/esfera com geometria ilustrada; validar materiais didáticos.
- Testar todos os níveis por drag e toque simples, mudança de nível após sugestão, botão de dica e conclusão.
- Testar PWA cache atualizado e fallback offline depois de instalar o SW 2.4.
- Testar coexistência e merge com PR #14 (piano) porque ambas alteram app.js e index.html.
- Inspecionar com DevTools vazamento de eventos/RAF na navegação e perdas de pointer capture.

## Segurança e publicação
- Nenhuma chamada a rede, CDN, credencial, novo backend ou alteração de RLS.
- Novos dados são apenas estados locais das atividades e um evento de conclusão anônimo.
- Sem cópia de assets ou módulos de fontes externas; reaproveita a infraestrutura e atividades já existentes no repositório touch.
- PR em rascunho, **sem deploy**. Manter \`gh-pages\` em Studio 2.2 até aceite.

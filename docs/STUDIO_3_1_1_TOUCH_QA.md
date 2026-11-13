# AGV TOUCH Studio 3.1.1 — Correção de toque e tela cheia

## Escopo
Hotfix incremental em cima da Studio 3.1. Não altera dados de alunos, autenticação administrativa, regras dos jogos anteriores, áudio da entrada ou os 11 materiais disponíveis no laboratório geométrico.

## Defeitos corrigidos
1. **Arraste de blocos no Android:** eventos de toque podem ter captura implícita. Antes, a lógica procurava a coluna de destino em `e.target`, normalmente o elemento de origem. Agora usa `document.elementFromPoint(clientX, clientY)` no `pointerup`, com fallback para navegador sem a API.
2. **Clique fantasma após soltar o bloco:** o evento `click` gerado após o `pointerup` podia selecionar ou criar um segundo bloco. Agora uma janela de 380 ms protege o gesto concluído, sem impedir o clique normal em uma nova ação.
3. **Cancelamento do gesto:** `pointercancel` libera corretamente o material e a origem arrastada.
4. **Turnos da CPU no jogo da velha:** quando a máquina está processando, casas vazias ficam visualmente desativadas e a grade anuncia `aria-busy=true`. Após a jogada o tabuleiro volta ao estado normal.
5. **Fullscreen em todas as atividades da Oficina:** botão expande/reduz a área de jogo, respeita `fullscreenchange` e apresenta mensagem quando o navegador não suporta ou bloqueia a operação. O crédito “Desenvolvido por Gabriel Elienai” permanece discreto também em tela cheia.

## Compatibilidade
- **Android WA86F:** implementação prioriza `Pointer Events` e coordenadas reais de soltura; avaliação física ainda pendente.
- **Mouse / caneta:** arraste e clique permanecem disponíveis, com realce no destino.
- **Acessibilidade:** toque simples alternativo para movimentação, foco visível, `aria-busy`, redução de movimento.
- **Offline:** cache PWA invalidado para `v3.1.1`, com novos recursos já existentes mantidos.

## Evidências de engenharia
- 19 verificações (Oficina, materiais geométricos e novo teste de toque): aprovadas em execução simulada de JavaScript.
- 16 verificações (identidade e plataforma UX): aprovadas em execução simulada.
- 7 verificações de CSS, integração HTML e cache: aprovadas.
- Smoke test dinâmico de arraste com `pointerup` retargeted, bloqueio de clique duplicado, fullscreen e espera do turno da CPU: verificações relevantes aprovadas.
- Teste físico de áudio/multitoque/4K no painel e renderização visual real não executados. O navegador de automação externo estava sem saldo; nenhuma execução dele foi concluída.

## Homologação manual pós-publicação
1. Abrir `https://gb-eli.github.io/touch/oficina.html` no Chrome da Samsung WA86F e escolher Blocos.
2. Tocar em Grama, adicionar um bloco na coluna 1, arrastá-lo para a coluna 2 e confirmar que a coluna 1 fica vazia (sem bloco duplicado).
3. Arrastar um material da paleta diretamente para uma coluna; repetir com mouse e caneta. Testar mover entre colunas cheias e desfazer.
4. Alternar para Jogo da Velha, escolher CPU, jogar X e observar casas temporariamente desativadas; testar reinício durante a jogada.
5. Ativar e sair do modo tela cheia em cada atividade, conferir crédito, contraste, posição do botão e estabilidade de layout.
6. Verificar a abertura com áudio após `Começar agora`, calibração com quatro alvos, navegação pelos módulos, biblioteca, piano e Arcade.
7. Testar dimensões 360, 390, 430 px, 1920×1080 e 3840×2160, com e sem redução de movimento, e 10 min de uso contínuo.

As afirmações de conclusão de qualidade devem distinguir testes de código de observações reais no painel.

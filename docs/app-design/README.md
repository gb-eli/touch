# TV Touch · Criar. Experimentar. Aprender.

Referência de experiência para o MVP Android: um laboratório criativo de blocos, quatro missões e projetos locais. A sequência de produção foi **mapa de fluxos → baixa fidelidade → alta fidelidade navegável → implementação nativa**.

## Abrir a experiência

| Arquivo | Conteúdo |
| --- | --- |
| [01-low-fidelity.html](01-low-fidelity.html) | Wireframes em escala de cinza: mapa, início, atividades, construtor, projetos, missão, resultado e ajustes. |
| [02-high-fidelity.html](02-high-fidelity.html) | Protótipo navegável completo, em um único HTML, sem dependências ou serviços externos. |
| [flow-map.mmd](flow-map.mmd) | Fluxograma Mermaid editável. O mesmo mapa está na primeira tela da baixa fidelidade. |
| [UX_CONTRACT.md](UX_CONTRACT.md) | Telas, navegação, cores, regras de interação, missões e estados para implementação Android. |

Abra o HTML de alta fidelidade em um navegador. O arquivo contém CSS, JavaScript, ícones e gráficos vetoriais próprios. Não exige instalação, conta ou acesso à internet.

## Telas e estados

- **Início:** construção livre, missão em destaque, projetos recentes e indicação da próxima etapa de câmera.
- **Explorar:** busca e filtros de atividades; quatro desafios de construção.
- **Missão:** objetivo antes de começar, progresso calculado no construtor e resultado quando as posições-alvo estiverem completas.
- **Construtor:** selecionar uma posição, visualizar a prévia e confirmar em **Colocar bloco**. Apagar também exige confirmação. Girar, zoom, materiais, desfazer e refazer estão disponíveis.
- **Projetos:** estado vazio inicial, salvar com nome, reabrir, renomear, excluir com confirmação e importar/exportar JSON.
- **Ajustes:** perfil de interface, movimento reduzido, preferência de meta de renderização e diagnóstico com limitações explícitas.

O construtor usa uma grade 8 × 8, seis níveis, até 256 blocos e nove materiais. As missões respeitam as coordenadas do modelo legado: ponte 5, torre 5, escada 6 e simetria 6. Todas começam vazias, com fantasmas das posições desejadas. O resultado verifica presença dos blocos-alvo; não representa uma simulação de engenharia estrutural.

No teclado, as setas movem a prévia no piso; Page Up/Page Down alteram a altura; Enter confirma; Escape limpa a seleção. No toque, escolher uma posição não altera o projeto. Arrastar gira somente com a ferramenta **Girar**; pinça aproxima ou afasta sem editar.

## O que esta prévia comprova

O HTML demonstra a composição visual, adaptação de layout, navegação, manipulação de blocos e estados de dados. O palco usa uma renderização demonstrativa em Canvas 2D com projeção 3D. A implementação Android usa seu próprio renderizador nativo.

Salvar nesta prévia grava apenas no `localStorage` do navegador, com indicação de **demonstração**. Limpar os dados do navegador pode remover esses projetos; exportar JSON cria uma cópia portátil. Uma falha de armazenamento mantém o diálogo e as alterações, sem informar sucesso.

**Câmera, realidade aumentada e rastreamento corporal não estão implementados nem simulados.** As entradas correspondentes explicam o estado futuro; nenhuma delas solicita acesso à câmera. A preferência 30/60 quadros/s não mede nem garante esse desempenho. O diagnóstico não certifica o Galaxy S25 Ultra ou a Samsung WA86F.

## Referências visuais

A revisão 0.1.1 acrescenta [capturas e relatório da paisagem curta em 844 × 390](evidence/review-0.1.1/README.md). O conjunto abaixo preserva a referência inicial.

As capturas incluem uma construção de cores e uma ponte produzidas em uma sessão isolada de verificação. São exemplos de demonstração, não dados de usuários nem projetos pré-carregados no produto.

| Referência | Paisagem 1280 × 720 | Móvel 412 × 915 |
| --- | --- | --- |
| Início | [Imagem](evidence/03-high-home-desktop.png) | [Imagem](evidence/03-high-home-mobile.png) |
| Explorar | [Imagem](evidence/04-high-explore-desktop.png) | [Imagem](evidence/04-high-explore-mobile.png) |
| Construtor | [Imagem](evidence/10-high-builder-desktop.png) | [Imagem](evidence/10-high-builder-mobile.png) |
| Projetos | [Imagem](evidence/08-high-projects-desktop.png) | [Imagem](evidence/08-high-projects-mobile.png) |
| Ajustes | [Imagem](evidence/09-high-settings-desktop.png) | [Imagem](evidence/09-high-settings-mobile.png) · [Diagnóstico](evidence/09-high-settings-detail-mobile.png) |

Também estão disponíveis [o início vazio](evidence/00-high-home-empty-desktop.png), [o briefing da ponte](evidence/05-high-mission-desktop.png), [o construtor da missão](evidence/06-high-builder-mission-desktop.png), [o resultado](evidence/07-high-result-desktop.png), [o mapa de baixa fidelidade](evidence/01-low-map.png) e [o início de baixa fidelidade](evidence/02-low-home.png).

## Fontes e verificação

As fontes editáveis são `prototype-shell.html`, `prototype.css`, `prototype.js`, `prototype-app.js` e `prototype-renderer.js`. Para atualizar o HTML autossuficiente:

```sh
python docs/app-design/build-prototype.py
```

O roteiro [verify-prototype.cjs](verify-prototype.cjs) usa Node.js, Playwright e Chromium para verificar navegação, edição, persistência, falha de salvamento, importação/exportação, missão e layout. Gere as capturas e o [relatório JSON](evidence/prototype-qa.json) com:

```sh
node docs/app-design/verify-prototype.cjs
```

Se necessário, informe `BROWSER_EXECUTABLE_PATH` com o caminho do Chromium. Playwright é uma dependência exclusiva da verificação; o protótipo não depende dele. O roteiro cobre 1280 × 720, 412 × 915 e 844 × 390. Em paisagem curta, também exige cena com pelo menos 65% da altura da janela, controles ao lado da cena e confirmação visível com alvo de pelo menos 48 px. O relatório registra erros JavaScript/console, requisições externas e largura de conteúdo nos três viewports. As capturas respeitam movimento reduzido e aguardam o desaparecimento das mensagens temporárias.

A CI executa esse roteiro com o Chrome instalado no runner e guarda as evidências em `browser-artifacts/prototype`. Use `TV_TOUCH_PROTOTYPE_OUTPUT` para escolher outra pasta de saída sem substituir o conjunto histórico de capturas acima.

Na revisão 0.1.1, o construtor ganhou uma composição lateral para celulares em paisagem curta e texto secundário com maior contraste. A baixa fidelidade e o fluxograma mantêm a mesma arquitetura de telas.

Os testes do navegador verificam esta prévia. A instalação do APK, desempenho, pausa/retorno, toque/caneta e aceitação física na escola pertencem à validação nativa e aos testes nos aparelhos.

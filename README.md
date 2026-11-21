# TV TOUCH · AGV

Portal educacional interativo para **painéis Samsung WA86F de 86″**, desenvolvido em HTML, CSS e JavaScript estáticos, para uso com toque, mouse e teclado em orientação horizontal.

- **Produção verificada em 20/11/2026:** Studio **3.7.2**, em https://gb-eli.github.io/touch/.
- **Versão em homologação nesta branch:** Studio **3.8.0** (alvos touch, crédito fora do dock e diagnóstico prático da pinça).
- **Fonte canônica:** `main` (aplicação + testes + documentação); publicação: `gh-pages` com **somente `public/`** na raiz.
- **Produção confirmada antes desta revisão:** `main` em `f7c0c498b557317df5855fe8dbb4738e53630412` e `gh-pages` em `6b48514ba3bad001b89d010d161e9bbea24e8f95`. Não presumir que merge em `main` implica deploy no Pages.
- **Estado da 3.8.0:** implementação isolada; exige revisão da PR, CI e aprovação específica para publicar.

## Experiência e navegação

| Rota | Função |
| --- | --- |
| `/` | Launcher de **seis experiências** (Universo 3D, Quadro livre, Formas 3D, Memória, Vídeos 360°, Teste de toque), atalhos, navegação e ferramentas adicionais |
| `/oficina.html` | Oficina interativa, incluindo construtor WebGL 3D com materiais, objetivos, controles de câmera e alternativa 2D |
| `/arcade.html` | Snake, Pong, Basquete e Sinuca; comportamentos de jogo verificados em navegador |
| `/#diagnostico` | Inventário de capacidades informadas, teste prático de múltiplos contatos, teste indicativo de FPS e relatório local |
| `/admin.html` | Interface administrativa existente, com operações reais condicionadas à integração e às permissões configuradas |

O aplicativo oferece **entrar/sair de tela cheia por gesto do usuário** (Fullscreen API), mantém saída visível e calcula a interface com base na área útil do navegador, não apenas na resolução física. Não calibra o controlador de toque infravermelho da TV. O manifesto PWA usa `display: standalone`; instalar o site e entrar em fullscreen são funcionalidades diferentes.

A orientação visual é de **aplicativo horizontal**: superfícies de alto contraste, temas próprios, matriz de atividades, alvos amplos, feedback de toque e movimento reduzido quando solicitado. O relatório técnico pode rolar internamente sem ficar por baixo do dock. Recursos offline são versionados pelo Service Worker; nunca armazenar dados de alunos ou segredos no cache.

## Evidências físicas e limitações de aceitação

No diagnóstico fotografado em uma Samsung WA86F, o navegador declarou **1280×720 pixels CSS**, escala **3×**, Linux ARM, Chrome 157, aproximadamente 8 GiB de memória e oito processadores lógicos. Estas são informações **reportadas pelo navegador**, não inventário de hardware certificado.

- `navigator.maxTouchPoints` informou **1**; o teste de eventos de ponteiro observou **16 contatos simultâneos** durante a medição. O resultado prático tem prioridade, mas não prova o funcionamento de cada gesto em todas as atividades.
- O teste simples de `requestAnimationFrame` indicou **44 FPS** naquela sessão. Isso **não equivale** a uma medição de FPS do construtor WebGL, nem autoriza afirmar que a TV sustenta ou não 60 FPS no jogo.
- A Studio 3.8.0 acrescenta detecção de **aproximar/afastar dois dedos** na área de diagnóstico, mas a comprovação física da pinça e da rotação no construtor continua **PENDENTE**.
- WebGL, WebGL 2, WebGPU e Fullscreen API foram relatados como disponíveis; desempenho e estabilidade reais precisam de testes com a TV.

**Critério de aceite em sala:** usar a TV real em paisagem, com e sem navegador em tela cheia, confirmar leitura e interação na interface, ausência de conteúdo sob o dock, desenho, rotação, pinça, construção 3D e fluidez durante cinco minutos de uso real. Registrar versão, navegador e ações observadas, sem imagens de alunos.

## Matriz de QA e comandos

O roteiro de aceite físico da nova revisão está em [docs/QA_STUDIO_3_8_WA86F.md](docs/QA_STUDIO_3_8_WA86F.md).

A suíte Chrome usa `tests/browser-smoke.mjs` e produz capturas e `browser-artifacts/report.json`, incluindo **390×844, 844×390, 1024×600, 1280×720 com DPR 3, 1366×630, 1920×1080 e 3840×2160**. A simulação `PointerEvent` em Chrome verifica apenas o algoritmo, **não substitui toques reais na WA86F**.

```bash
node --test tests/*.test.cjs
find public/js -name '*.js' -type f -print0 | xargs -0 -n1 node --check
node --check public/service-worker.js
```

O projeto não depende de `package.json` para executar os testes Node; a suíte de navegador usa Playwright e Chrome disponíveis no CI. Consulte `.github/workflows/quality.yml` para a instalação exata e a captura de evidências. Evitar CI repetitivo por alteração pequena: consolidar testes e código antes de abrir a PR.

## Publicação segura e reversão

1. Preparar alterações numa branch isolada e revisar o diff; não alterar dados, Auth, RLS, Supabase, credenciais ou permissões por uma mudança visual.
2. Verificar testes Node, sintaxe JS, navegador e screenshots no mesmo perfil de viewport; declarar limitações físicas.
3. Solicitar **autorização de produção** específica depois de aprovado o conjunto.
4. Integrar a PR à `main`; publicar a árvore de `main/public/` como raiz de `gh-pages`, com `.nojekyll`, nunca a raiz de `main`.
5. Conferir CI da `main`, deploy gerenciado do Pages, versões de assets/cache e as três rotas públicas. O commit `6b48514ba3bad001b89d010d161e9bbea24e8f95` é o último ponto de publicação **verificado antes da revisão 3.8**; registrar outro backup a cada publicação.

Leia [`docs/DEPLOY.md`](docs/DEPLOY.md) para procedimentos de GitHub Pages e backend opcional. Recursos externos (como vídeos) dependem das políticas e disponibilidade de seus fornecedores; não anunciar conteúdo individual como curado sem conferência.

## Governança de trabalho antigo

Em 20/11/2026, as PRs **#8, #14, #15 e #16** estavam abertas em *draft* e suas branches haviam divergido aproximadamente **119 commits atrás da `main`**. As melhorias em piano, geometria e curadoria **não devem ser integradas diretamente** dessas branches antigas: comparar conteúdos e aproveitar somente o que ainda estiver ausente, mediante mudanças novas e testes. Nenhuma dessas PRs deve ser encerrada ou apagada automaticamente.

O conteúdo anterior deste README, que descrevia a versão Studio 2.6, foi preservado em [`docs/HISTORICO_README_STUDIO_2_6.md`](docs/HISTORICO_README_STUDIO_2_6.md). O histórico Git também mantém todas as versões.

## Privacidade e arquitetura

`public/` contém apenas recursos estáticos públicos, sem segredos. `supabase/` mantém o backend opcional separado; eventuais credenciais privadas ficam exclusivamente no servidor e permissões precisam ser conferidas antes de ativação. O diagnóstico não coleta automaticamente IP público nem coordenadas, e seu relatório exportado omite esses identificadores. Não confundir indicação de disponibilidade de uma API com permissão concedida ou capacidade física testada.

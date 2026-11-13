# TV TOUCH / Studio 2.1 — AGV

Portal educacional para os painéis interativos Samsung WA86F de 86 polegadas, Android 14, uso horizontal. O código estático funciona no GitHub Pages sem framework ou workflow personalizado.

## Atualização Studio 2.1

- Tutorial de primeiro acesso em quatro etapas, com opções **Ver tutorial** e **Ir para ferramentas**; pode ser reaberto na barra superior.
- Refinamento dos estados de toque, foco visível e contraste dos cartões.
- Escolha de disciplina preservada no topo; opção de telemetria continua voluntária.
- Arquivos do tutorial disponíveis no cache do PWA.

## Interface

- Launcher de 5 experiências em mosaico, com alvos grandes e barra de navegação inferior, projetado para 16:9.
- Temas Black, Claro e Vivo, com variação de fundo moderada, opção Pausar e preferência salva no navegador.
- Ícones SVG próprios; imagens de marca em SVG/PNG locais.
- Estrutura responsiva para 1366×768, 1920×1080 e 3840×2160, com opção de navegação em telas menores.
- Transições com `prefers-reduced-motion` e animações pausadas quando a aba não está visível.

## Experiências

- **Universo 3D**: renderizador WebGL sem dependência de rede; fallback Canvas 2D; seleção de planetas, arraste para girar, pinça para zoom.
- **Quadro livre**: desenho touch com cores, desfazer, salvar PNG (módulo anterior preservado).
- **Formas 3D**: geometria manipulável por toque (módulo anterior preservado).
- **Memória**: jogo de 6 pares com flip 3D, contagem de jogadas e reinício.
- **Física 2D**: lançamento de esferas, gravidade ajustável, colisões simplificadas.
- **Encaixe e quiz portuário**: preservados no laboratório.
- **Biblioteca e vídeos**: acesso a recursos externos com aviso de necessidade de conexão e verificação pedagógica.

## Arquitetura e segurança

- `public/` = site estático (HTML/CSS/JS/SVG/PNG), sem segredos.
- `supabase/` = backend opcional. Não publicar scripts SQL, Edge Function ou chaves secretas no GitHub Pages.
- `docs/` = projeto, evolução e procedimentos.
- `public/admin.html` = administração existente; operações reais dependem de Supabase Auth e políticas RLS.
- Perfil e parâmetros de gesto por TV dependem do backend. Web apps não recalibram o controlador infravermelho físico.
- Sem professor/aluno obrigatório, sem envio de notas, desenhos ou dados pessoais. Telemetria permanece opcional.

## Implantação com GitHub Pages

`main`: código-fonte completo. `gh-pages`: **apenas conteúdo de** `public/` na raiz. Settings → Pages → Deploy from a branch → `gh-pages` → `/(root)`. Não usar workflow próprio.

A publicação por branch ainda pode criar uma execução gerenciada do Pages, eventualmente contabilizada no plano privado. Confira o consumo em Billing. Para zero GitHub Actions, utilize hospedagem externa.

## Homologação

`node --check public/js/*.js`, inspeção de referências e testes de navegador em resoluções horizontais. As interações WebGL/IR multitouch devem ser verificadas na Samsung WA86F real antes de homologação final.

As experiências astronômicas e físicas são modelos didáticos ilustrativos, não simuladores científicos em escala.
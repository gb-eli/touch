# TV TOUCH STUDIO 0.2 — Blueprint de Produto e Implementação

> **Produto:** TV Touch, laboratório criativo Android  
> **Alvos:** Samsung Galaxy S25 Ultra (testes em casa) e Samsung WA86F 86" (aceite em escola)  
> **Status:** protótipo funcional implementado no branch \`app/studio-0.2-premium\`; validação física da versão 0.2 pendente  
> **Princípio:** o mesmo núcleo educacional e os mesmos projetos, com interfaces adaptativas, sem dependência da web para criar

## 1. Visão e padrão de qualidade

**Proposta:** um estúdio tátil de aprendizagem espacial: uma pessoa escolhe uma jornada, cria com blocos 3D, aprende construindo, guarda seus projetos e explora modelos originais. Cada tela deve tornar a próxima ação óbvia; animações comunicam mudanças de estado sem atrasar a pessoa.

A referência de orçamento de R$ 50 mil é tratada como **nível desejado de acabamento e método**, não como afirmação de valor de mercado do executável nem como comprovação de homologação. O plano separa entrega de engenharia, teste de laboratório e teste físico.

**Critérios transversais de pronto:**

1. Sem caminhos fictícios nem botões decorativos: toda ação leva a uma tela, mudança de estado ou informação precisa.
2. Evitar perda de projetos: salvar explicitamente, proteger rascunhos e atualizar sem alterar \`applicationId\` nem assinatura.
3. Foco no gesto: ação primária presente na parte baixa no celular e controles grandes e legíveis na TV.
4. Sem internet obrigatória para criar, abrir, importar/exportar em arquivos locais ou completar missões.
5. Acessível: contraste suficiente, rótulos de conteúdo, resposta ao aumento de fontes e preferência de movimento reduzido.
6. Medir desempenho real em cada aparelho; não inferir que uma execução em emulador homologa a WA86F.

## 2. Experiência do produto

**Navegação:** Início · Explorar · Biblioteca · Projetos · Ajustes.

| Área | O que a pessoa vê | Função real | Estado vazio / erro |
| --- | --- | --- | --- |
| Início | hero "Um universo para inventar", continuar projeto, visita guiada, desafios, entrada na Biblioteca | criar, retomar, abrir missões, visitar Biblioteca | apresenta CTA de criação; aviso local se armazenamento falhar |
| Explorar | jornada 0/4 e desafios Torre, Escada, Ponte e Simetria | briefing, construção guiada, progresso persistente | progresso 0/4 com instruções |
| Biblioteca | seis modelos originais com miniatura feita dos próprios blocos | carregar cópia editável, personalizar e salvar | modelos locais; sem dependência de catálogo remoto |
| Projetos | cards com miniatura real, filtros, favoritos, opções | abrir, favoritar, duplicar, renomear, exportar/importar, excluir com confirmação | novo projeto ou "sem favoritos"; projeto corrompido não é apresentado como válido |
| Construtor | cena 3D, grade, materiais, ferramentas, histórico e ação | selecionar, colocar/apagar, girar, aproximar, coordenadas, desfazer/refazer, salvar | prévia inválida desabilita confirmação |
| Ajustes | perfil visual, movimento reduzido, FPS, atualização e diagnóstico | persistir preferências, verificar nova versão, exportar diagnóstico, rever guia | informação explícita sobre módulos ainda ausentes |

**Microfluxos:**

- **Primeiro uso:** Início → visita guiada de três passos → construir → salvar → Projetos.
- **Modelo:** Biblioteca → escolher modelo → cópia editável → modificar → salvar → card novo em Projetos. O modelo original não muda.
- **Missão:** Explorar → briefing → construtor → preencher coordenadas-alvo → resultado → progresso local 1/4 → salvar.
- **Projeto:** Projetos → favoritar / filtrar → duplicar → abrir cópia → editar; exclusão confirmada. Favorito é um atributo de interface local, não do arquivo JSON.
- **Atualização:** Ajustes → verificar → conferir novidades → baixar e validar APK → instalador Android → confirmação do usuário. O app **não** instala APK silenciosamente.

## 3. Sistema visual — Studio Prism

Uma linguagem visual criativa, mas legível: superfícies quase brancas, roxo violeta para a ação e azul-noite para estrutura, lima como energia da marca e cores acentuadas por seção. Textos escuros no branco; texto claro nos fundos escuros.

| Token | Valor | Uso |
| --- | --- | --- |
| Night / Ink | \`#10142F\` | fundo de navegação e hero |
| Violet | \`#6352E8\` | CTA principal, estados ativos, indicadores |
| Lime | \`#BDFA79\` | contraste expressivo em hero escuro |
| Cyan | \`#77DCF0\` | detalhes de descoberta e cor complementar |
| Lavender | \`#EAE5FF\` | painéis de onboarding e progresso |
| Mint | \`#B9F6DB\` | superfícies de biblioteca / criatividade |
| Peach | \`#FFB29C\` | acentos em ilustrações |
| Surface | \`#F6F6FC\` | tela |
| Text | \`#191C39\` | texto principal |
| Muted | \`#58657B\` | texto de apoio |
| Border | \`#E0E4EF\` | divisões e cartões |

**Tipografia:** sans-serif nativa com hierarquia de títulos 30–38 sp, seções 20–24 sp, corpo 14–16 sp, microtexto 11–12 sp; testar legibilidade em 150% e não depender só de cor para estado.

**Geometria:** cartões 24 dp, botões 17 dp, navegação ativa 18 dp, separações modulares 8/12/16/24 dp, bordas suaves em superfícies funcionais e elevadas. Ícones de traço vetorial, sem imagens stock.

**Movimento:** transições de 190 ms entre telas comuns, ripple de botões nativo e feedback visual ao adicionar/remover blocos. A opção "Reduzir movimento" desativa a transição. **Não** animar o renderizador 3D como se fosse um componente HTML.

## 4. Responsividade e ergonomia

| Perfil | Largura e orientação | Navegação | Construtor |
| --- | --- | --- | --- |
| Compacto | celular retrato | cinco itens na barra inferior | cena livre; faixa horizontal de materiais; desfazer/refazer/salvar e confirmar no rodapé |
| Paisagem curta | \`widthDp >= 600\` e \`heightDp < 520\` | telas gerais usam o espaço disponível | cena à esquerda; dock rolável de materiais/ferramentas à direita; ação de confirmar fixa |
| Expandido | \`widthDp >= 840\` (fora do editor paisagem curta) | trilho lateral | cena ampla, paleta e edição no rodapé; validação obrigatória na WA86F |

**Thumb zone S25:** ações mais frequentes em região inferior, materiais acessíveis por rolagem horizontal, salvar sem alcançar o topo. Targets nativos de pelo menos ~48 dp, ampliados no perfil TV. Não colocar funções destrutivas na mesma posição de confirmar sem indicar modo.

**WA86F:** dimensionamento baseado em largura útil real, não apenas resolução 4K. Testar toque, canetas, altura de leitura, renderização sustentada e a forma real de instalação.

## 5. Módulos e escopo

| Módulo | 0.2 | Próxima fase |
| --- | --- | --- |
| Construção 3D e missões | mantido e refinado | ferramentas de seleção múltipla e novos desafios |
| Biblioteca de modelos | seis modelos locais editáveis | temas adicionais e distribuição de pacotes |
| Progresso | quatro missões com estado local | perfil pedagógico e conquistas mais elaboradas |
| Projetos | cartões, favoritos, cópia, importação/exportação e recuperação | miniaturas persistidas como cache, busca e filtros adicionais |
| Onboarding | visita guiada de três passos, reabrível | tutorial contextual dentro da cena |
| Atualizações | canal de APK de teste (dependente de release assinado) | painel de release notes com rollback administrativo |
| Câmera / RA / corpo | informações honestas, sem botão que simule captura | integrações nativas, prova de desempenho e consentimento |
| 360° / VR | não incluídos nesta versão | suporte após hardware e fluxo de navegação definidos |

**Segurança e privacidade:** sem conta, SDK de analytics ou transmissão automática de projetos; o updater já possui rede, mas não é dependência do núcleo. Câmera não é solicitada.

## 6. Dados e continuidade

- Pacote de desenvolvimento \`br.com.agv.touch.dev\`, versão \`0.2.0-dev\`, código \`6\`.
- Conserva a assinatura de desenvolvimento usada pelo proprietário na 0.1.2; nunca incluir keystore no GitHub.
- Mantém o formato JSON existente e o armazenamento privado, com recuperação.
- Biblioteca chama \`ProjectCodec.create(...)\` para dar **novo UUID** ao modelo; não substitui projeto existente.
- Favoritos e onboarding ficam em \`SharedPreferences\`; exclusão remove eventual favorito.
- Conclusão de missão é local, registrada somente quando o resultado é aberto após completar posições.
- Durante transição de versões, a instalação **in-place** precisa ser testada para preservar projetos e rascunhos.

## 7. Fluxograma

\`\`\`mermaid
flowchart TD
 A["Início"] --> B["Visita guiada"]
 A --> C["Studio 3D: livre"]
 A --> D["Explorar"]
 A --> E["Biblioteca"]
 A --> F["Projetos"]
 D --> G["Briefing da missão"]
 G --> H["Construtor 3D"]
 E --> I["Escolher modelo"]
 I --> H
 C --> H
 H --> J{"Modificar / concluir"}
 J --> H
 J --> K["Salvar projeto"]
 K --> F
 F --> L["Favoritar / duplicar"]
 L --> F
 F --> M["Abrir projeto"]
 M --> H
 A --> N["Ajustes"]
 N --> O["Verificar atualização"]
 O --> P{"Release assinado válido?"}
 P -->|Sim| Q["Download e instalador Android"]
 P -->|Não| R["Mensagem clara, sem instalar"]
\`\`\`

## 8. QA: critérios verificáveis

**Jornada Android:** executar Home → Biblioteca → escolher modelo → adicionar e remover bloco → salvar → fechar o app → reabrir projeto → duplicar → favoritar → filtrar. Rodar com fontes 100% e 150% e com redução de movimento.

**Regressões de dados:** nenhum novo modelo pode violar limites \`8×8×6\`, 256 blocos ou materiais aceitos; cada exportação reabre no formato validado; UUID é novo; uma atualização não sobrescreve arquivos antigos.

**Compatibilidade:** emulador serve para identificar erros de UI e ciclo de vida, mas **não** para homologar FPS, multitouch, S Pen, caneta da TV, webcam USB ou sala de aula. O S25 Ultra e WA86F têm checklists independentes.

**Observabilidade:** diagnóstico local exportável (versão, aparelho, GPU, contatos observados, FPS amostrado); não guardar vídeos de estudantes.

**Aceite de design:** navegação sem corte, CTA no thumb zone, contraste nos textos, estados de erro e vazios claros, botões sem comando inválido, rascunhos preservados, animações desativáveis.

## 9. Sequência de entrega

1. **Design + arquitetura de informação** — tokens, mapa, fluxos e alta fidelidade.
2. **Núcleo UX/UI** — navegação em cinco destinos, hero, jornada, modelos, projetos e editor.
3. **Qualidade** — teste dos modelos, build, lint, regressão de projetos, verificação e assinatura do APK.
4. **Distribuição** — APK 0.2.0 assinado com certificado compatível; canal de atualização somente quando release GitHub com tamanho e SHA corretos estiver publicado.
5. **Teste físico** — instalar no S25 e depois WA86F; iterar legibilidade, controles, desempenho e atualizador.

### Pendências que impedem declarar produção concluída

- Instalação da 0.2.0 sobre a 0.1.2 em aparelho real, preservando projetos.
- Revisão visual e acessibilidade em celular e TV físicos, incluindo fonte ampliada.
- Performance 3D, toque simultâneo, caneta e uptime em aula na WA86F.
- Publicação de um APK assinado no GitHub Releases, com catálogo atualizado **somente após** verificação do anexo.

Um orçamento robusto justifica processos completos de design, engenharia, QA físico e manutenção. Esta revisão entrega uma base real para esses processos, mas **não se declara homologada só por compilar**.

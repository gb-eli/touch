# TV Touch Android — MVP 0.1.2-dev

Aplicativo Android nativo de construção com blocos 3D, missões e projetos locais. O MVP usa **Java, Views Android e OpenGL ES 2.0**, com um código compartilhado para o Galaxy S25 Ultra e a Samsung WA86F. A decisão de implementação e sua relação com o planejamento inicial estão registradas em [Arquitetura e build](../docs/android/BUILD.md).

O pacote de desenvolvimento tem identidade `br.com.agv.touch.dev`, versão **`0.1.2-dev`**, código **`5`**, e aparece no launcher como **AGV Touch · Teste**. O aceite físico no S25 Ultra e na WA86F está **pendente**; execução em um aparelho ou emulador não homologa o outro.

## Telas e funções implementadas

| Tela | Funções disponíveis |
| --- | --- |
| **Início** | Abrir construção livre, continuar projeto ou rascunho da sessão e acessar missões. |
| **Explorar** | Construção livre, quatro missões e informação sobre as próximas experiências de câmera. |
| **Missão** | Prévia do objetivo, instruções e início da atividade escolhida. |
| **Construtor** | Seleção e confirmação de posições, adicionar/apagar blocos, girar, aproximar, afastar, enquadrar a construção e escolher coordenadas. Nove materiais, desfazer/refazer, contagem e progresso. |
| **Projetos** | Salvar, abrir, renomear, excluir mediante confirmação, importar e exportar JSON. |
| **Ajustes** | Perfil visual, preferência de movimento reduzido, limite de renderização de 30/60 FPS, atualizações verificadas e diagnóstico local exportável. |

A grade mede **8 × 8 × 6**, com até **256 blocos** e **40 estados anteriores** no histórico. O histórico é preservado na mudança de configuração da atividade; a restauração após encerramento do processo recupera o projeto, sem prometer o histórico completo da sessão anterior.

### Quatro missões

- **Torre de possibilidades:** preencher cinco posições empilhadas.
- **Um passo de cada vez:** construir a escadaria de seis posições.
- **Ponte de ideias:** conectar os dois apoios, completando cinco posições.
- **Espelho de blocos:** preencher as seis posições do padrão simétrico.

A conclusão considera as coordenadas-alvo; permite materiais diferentes e blocos extras. As regras e o formato de dados estão em [Contrato do domínio](../docs/android/DOMAIN_CONTRACT.md).

## Como experimentar o construtor

1. Abra **Início → Começar a construir**, ou escolha uma missão em **Explorar**.
2. Escolha um material e a ferramenta **Adicionar**.
3. Toque no chão ou em uma face. Confira a prévia e use **Colocar bloco** para confirmar.
4. Para remover, escolha **Apagar**, selecione o bloco e confirme. Para mudar a vista, use **Girar**, pinça ou os botões de câmera.
5. Use **Coordenadas**, disponível também em **Ferramentas → Escolher coordenadas**, quando precisar escolher precisamente X, Y e Z.
6. Toque em **Salvar**, informe o nome e aguarde a confirmação. O projeto passa a aparecer em **Projetos**.

Selecionar uma posição e editar são ações separadas. Arrastar ou fazer pinça não coloca blocos automaticamente.

**Enquadrar construção** considera o chão inteiro, a altura da construção e os objetivos da missão, adaptando a distância à proporção da área 3D. O enquadramento permanece estável enquanto você edita ou gira; use esse comando novamente depois de aumentar a altura. Aproximar manualmente pode cortar parte da cena. A rotação da tela preserva a vista; abrir ou criar outro projeto inicia um novo enquadramento.

## Projetos, importação e recuperação

Os projetos explícitos e o rascunho de recuperação são armazenados separadamente na área privada do app. Existe uma cópia anterior válida para recuperação. Se essa cópia for utilizada, a interface informa o ocorrido; confirme o conteúdo antes de salvá-lo novamente.

Descartar alterações de um projeto recuperado exige primeiro abrir sua versão salva ou uma cópia anterior válida. Se ambas estiverem ilegíveis, o rascunho permanece disponível e o app informa o erro. Essa proteção também vale para **Descartar rascunho** no aviso de recuperação ao iniciar. Um rascunho novo, sem projeto salvo associado, pode ser descartado após a escolha explícita.

Em **Projetos → Importar JSON**, o app aceita o formato voxel legado `version:1` e suas próprias exportações. O seletor permite escolher arquivos sem depender da classificação MIME do provedor; é o conteúdo que precisa passar pela validação JSON. Valida UTF-8, tamanho, tipos, coordenadas, materiais e duplicatas antes de salvar; bytes de texto inválidos são rejeitados. **Cada importação recebe um novo UUID**: identidades recebidas no arquivo não substituem projetos existentes nem definem caminhos locais.

Para obter uma cópia externa, use **Projetos → Opções do projeto → Exportar JSON** e escolha o destino no seletor de arquivos Android. O núcleo funciona offline; para testar importação/exportação sem rede, escolha um provedor de arquivos local.

Importar e exportar executam o acesso ao provedor em segundo plano, com uma operação por vez. A interface mostra a etapa atual e permite solicitar cancelamento. Na importação, o cancelamento deixa de estar disponível quando começa a gravação local do projeto validado. Na exportação, a confirmação só aparece depois de gravar e fechar o arquivo; uma falha ou um cancelamento pode deixar um arquivo de destino incompleto.

O coordenador mantém a operação e seu resultado durante a rotação da tela. Cada importação pertence à sessão que a solicitou: se a edição atual tiver mudado, o projeto importado fica em **Projetos**, sem substituir essa edição. Encerrar o processo pelo sistema não tem a mesma garantia de rotação; ao restaurar uma sessão interrompida, confira **Projetos** e o destino da exportação antes de tentar novamente.

**Exporte os projetos antes de reinstalar, trocar a chave de assinatura ou migrar para outra identidade do aplicativo.** A variante `.dev` e uma futura versão de produção têm áreas de dados diferentes. O MVP não depende de backup automático do sistema ou sincronização em nuvem.

## Perfil visual e capacidades

O perfil **TV** aumenta os alvos de interação. A navegação lateral aparece quando a largura disponível comporta esse layout; um telefone em retrato continua com navegação adequada ao espaço. **Celular** e **Automático** também ajustam a apresentação.

O perfil não transforma o S25 em uma tela de 86 polegadas e não habilita sensores, câmera ou RA. Legibilidade a distância, alcance dos comandos, caneta e multitoque da WA86F exigem teste na escola.

O diagnóstico informa aparelho, Android, arquiteturas, janela, renderizador, última amostra de FPS e contatos observados. O ajuste de 30/60 FPS é um limite solicitado, não uma medição de desempenho nem uma garantia de estabilidade.

## Próximas experiências

**Câmera, ARCore/realidade aumentada, reconhecimento corporal ou de mãos e VR não estão implementados neste APK.** O acesso ao laboratório de câmera apresenta informação sobre essas próximas etapas. O manifesto não solicita câmera ou microfone. A permissão de internet permite somente consultar o catálogo e baixar APKs quando o usuário solicita a atualização.

A implementação futura de RA terá validação inicial no S25 Ultra. Captura externa na WA86F dependerá do caminho de câmera realmente exposto pelo aparelho. VR exigirá definição de equipamento e experiência próprios.

## Compilar e verificar

Pré-requisitos, versões fixadas, assinatura e verificação do APK: [BUILD.md](../docs/android/BUILD.md).

```sh
cd android
./gradlew --no-daemon :app:assembleDebug :app:lintDebug
```

APK resultante: `app/build/outputs/apk/debug/app-debug.apk`, a partir da pasta `android`.

A chave de teste fica **fora do Git**. Para atualizar uma instalação de desenvolvimento, preserve identidade e assinatura. Builds de outros ambientes podem ter outra chave; siga as orientações de migração do documento de build.

O runner `tests/run-core-tests.sh` executa conformidade com o modelo web, validação de projetos, persistência, picking, transferência com streams simulados e projeção da câmera. Ele usa um JAR JSON apenas no host; o app utiliza o JSON do Android. Os testes cobrem descarte seguro, UTF-8 inválido, cancelamento antes do commit, falha ao fechar arquivos e entrega do resultado a uma nova sessão de interface. Instruções e limites desses testes estão no contrato do domínio; eles não comprovam o funcionamento de um provedor SAF real nem a renderização no aparelho.

## Aceite

Execute e preencha o [roteiro de aceite](../docs/android/ACCEPTANCE.md). Ele separa testes em casa, testes na escola e regressões de sessão/dados. Uma compilação bem-sucedida e testes de domínio não substituem o uso do APK no Android nem o aceite físico da WA86F.

## Atualização pelo próprio aplicativo (canal de testes)

Em **Ajustes → Atualizações do aplicativo**, o usuário pode consultar o catálogo público, conhecer a versão nova e baixar o APK após confirmar. Na abertura do aplicativo há uma checagem no máximo a cada 24 horas. O resultado é discreto; o núcleo 3D continua totalmente offline. O app não envia nome de projeto, diagnóstico nem identificadores ao catálogo.

O catálogo fixo é `https://raw.githubusercontent.com/gb-eli/touch/main/docs/android/updates/dev.json`. Apenas o pacote `br.com.agv.touch.dev` é aceito; o instalador exige APK HTTPS de um release do repositório, código maior que o instalado, tamanho declarado, SHA-256 e mesma assinatura do app já instalado. Ao receber um pacote válido, o app permite abrir o instalador Android, que exige confirmação explícita e, quando necessário, autorização de instalação dessa origem. **Não há instalação silenciosa.** Uma versão publicada com certificado diferente é rejeitada.

O JSON entregue inicialmente **não contém APK**: o canal só oferecerá download depois que um release for assinado com a mesma chave de desenvolvimento da instalação atual e os metadados forem publicados. É preciso uma última instalação manual do APK 0.1.2-dev para habilitar o fluxo. Builds efêmeras do GitHub Actions usam outra chave e **não são atualizações compatíveis**. Caso se adote Play Store, substituir o mecanismo por Play In-App Updates na variante de produção, removendo a permissão de instalação de APKs.

A URL de release deve apontar para uma versão assinada e verificada. Não publique chaves, backups de keystore ou senhas no repositório. A instalação pela TV pode estar bloqueada por políticas de administração; nesse caso, o app apresenta o bloqueio e conserva os dados.

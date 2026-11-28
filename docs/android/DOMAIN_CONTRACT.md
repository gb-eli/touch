# Contrato do domínio voxel e dos projetos Android

## Origem e escopo

Baseline: [`gb-eli/touch`, commit `9fda57ce924fff27e598cf1c3dcfb4d2cedf8a1a`](https://github.com/gb-eli/touch/commit/9fda57ce924fff27e598cf1c3dcfb4d2cedf8a1a).
O modelo de referência é [`public/js/voxel-world.js`](https://github.com/gb-eli/touch/blob/9fda57ce924fff27e598cf1c3dcfb4d2cedf8a1a/public/js/voxel-world.js), blob Git `aa9e941174e7dc3b3ffabc090abc30054f3d3afb`.

A árvore completa dessa revisão não contém `AGENTS.md`. A PR #32, que introduziu o construtor WebGL, já está integrada à `main`. A PR #38 permanece em rascunho e modifica a apresentação do portal, sem alterar `voxel-world.js`, `voxel-renderer.js` ou `voxel-builder-ui.js`. O app parte da `main`; não depende de integrar essas branches antigas.

Este contrato documenta a revisão Android **`0.1.1-dev`**, código **`4`**. O domínio é independente de motor gráfico, implementado em Java 8 em `android/app/src/main/java/br/com/agv/touch/core/`. O contrato matemático de enquadramento está em `render/SceneCamera.java`. O site existente permanece separado da implementação Android.

## 1. Coordenadas, materiais e limites

| Item | Regra |
| --- | --- |
| Grade | X e Z inteiros de 0 a 7; Y inteiro de 0 a 5. |
| Quantidade | Máximo de 256 blocos, embora a grade tenha 384 células possíveis. |
| Ocupação | Uma célula contém no máximo um bloco. |
| Histórico | Até 40 snapshots anteriores; uma edição válida limpa o redo. |
| Referência visual | Centro do bloco: `(x - 3.5, y + 0.5, z - 3.5)`. O chão é Y = 0. |
| Comparação | A ordem dos blocos no JSON não é semântica. Nos testes, ordenar por Y, Z, X. |

| ID persistido | Nome | Cor de referência |
| --- | --- | --- |
| `grass` | Grama | `#51b95b` |
| `dirt` | Terra | `#966240` |
| `sand` | Areia | `#e1be76` |
| `stone` | Pedra | `#8f9da8` |
| `lava` | Lava | `#ff6337` |
| `ice` | Gelo | `#87e8f9` |
| `wood` | Madeira | `#b98044` |
| `brick` | Tijolos | `#cd705b` |
| `crystal` | Cristal | `#aa79f9` |

O desenho pode evoluir sem renomear os IDs persistidos. `materialColor` retorna a cor ARGB opaca; `materialLabel` retorna o nome. `materials()` e os elementos da lista são imutáveis.

## 2. Edições e continuidade do comportamento

- `add` exige limites válidos, material conhecido, espaço livre e capacidade disponível. No chão, qualquer célula livre serve; acima do chão, é necessário ao menos um vizinho por face. Contato apenas diagonal não serve.
- `move` exige origem existente e destino livre. A origem é excluída ao conferir o apoio do destino. O material é preservado e o movimento conta como uma única edição. Mover um bloco é permitido com 256 blocos quando o destino é válido.
- `remove` não aplica gravidade: outros blocos podem continuar suspensos. O importador também aceita construções suspensas válidas. Essa distinção é comportamento existente, não uma falha de validação do novo app.
- `clear` vazio, `undo` vazio, `redo` vazio e edições rejeitadas retornam `false`, sem alterar revisão ou histórico.
- Uma edição válida incrementa `revision`. Undo e redo também incrementam a revisão; ela não representa a posição dentro do histórico.
- `load(List<Block>)` valida tudo antes de substituir o mundo e é desfeito por undo. Uma importação idêntica ainda é uma edição, como no modelo web.
- `initialize(List<Block>)` é a operação Android para **abrir outro projeto**: valida primeiro e limpa undo/redo. Não permite desfazer uma construção para dentro do projeto anterior. Em entrada inválida, preserva integralmente mundo e histórico existentes.

`VoxelWorld` tem métodos de estado sincronizados. `blocks()` entrega uma lista imutável de `Block` imutáveis; o renderizador pode conservar esse snapshot enquanto a interface altera o mundo. `has`, `get`, `canPlace` e `progress` são sincronizados. A lista de `goals` também é imutável.

## 3. Missões

| ID | Objetivo por coordenadas | Total |
| --- | --- | --- |
| `free` | Sem objetivo obrigatório. | 0 |
| `tower` | X3/Z3, de Y0 a Y4. | 5 |
| `stairs` | X2/Y0/Z3; X3/Y0–1/Z3; X4/Y0–2/Z3. | 6 |
| `bridge` | X2 e X4 em Y0/Z3; X2, X3 e X4 em Y1/Z3. | 5 |
| `symmetry` | X2 e X5 em Y0–1/Z2; X3 e X4 em Y0/Z3. | 6 |

A interface pode mostrar coordenadas começando em 1, mas os dados começam em 0. Progresso conta as posições requeridas ocupadas, independentemente do material. Blocos extras não impedem concluir. `free` e uma missão desconhecida têm `done=0`, `total=0`, `complete=false`.

## 4. JSON legado e envelope Android

Formato legado mínimo aceito:

```json
{"version":1,"blocks":[{"x":3,"y":0,"z":3,"material":"grass"}]}
```

O envelope Android preserva `version:1` e `blocks`, acrescentando `projectId`, `name`, `updatedAt` e `mission`. `updatedAt` usa milissegundos UTC desde a época Unix. IDs são UUIDs canônicos minúsculos gerados pelo app. Nome tem até 80 caracteres e não contém caracteres de controle.

`ProjectCodec.decodeImport` sempre cria um novo UUID e uma data local, inclusive ao importar uma exportação do próprio app. `projectId` e `updatedAt` recebidos não definem caminho nem identidade local. Missão desconhecida importada vira `free`. O legado sem nome recebe “Projeto importado”. O nome e a missão do envelope, quando presentes, devem ter tipo textual.

`decodeStored(json, expectedId)` é reservado a arquivos privados já salvos pelo app. Exige identidade igual ao UUID associado ao arquivo. `decodeStored(json)` existe para o slot de recuperação de nome fixo, cujo caminho independe do UUID contido no JSON.

Validação obrigatória:

- Bytes de entrada em UTF-8 estrito: sequências malformadas ou não mapeáveis são rejeitadas, sem inserir caracteres de substituição. `ProjectCodec.decodeUtf8` e o leitor privado de `ProjectStore` aplicam essa regra. O stream de importação tem limite de 240.000 bytes antes da decodificação.
- JSON válido, sem comentários, aspas simples, texto posterior ou separadores sobrando; limite de 60.000 caracteres UTF-16, como o limite textual legado.
- `version` numérica e igual a 1; `blocks` deve ser uma lista com até 256 elementos.
- Cada bloco exige X, Y e Z numéricos, finitos, integrais e dentro dos limites; números como `0.0` ou `1e0` são integrais válidos. Strings, booleanos e campos ausentes não são convertidos para zero.
- Material conhecido e ausência de coordenadas duplicadas. A ordem de construção e o apoio físico não são requisitos de importação.
- Importação inválida retorna `ProjectFormatException` antes de alterar o mundo ou qualquer projeto salvo.

Os métodos `create` e `update` recebem snapshots válidos e rejeitam erro de uso com `IllegalArgumentException`. `update` mantém identidade e avança a data local. `encode` e os métodos de decodificação declaram `ProjectCodec.ProjectFormatException`.

## 5. Salvamento, cópia anterior e rascunho de recuperação

`ProjectStore(Context)` usa `filesDir/projects`. O construtor `ProjectStore(File)` executa o mesmo código nos testes de filesystem. Operações de armazenamento são sincronizadas e declaram `IOException`.

| API | Semântica |
| --- | --- |
| `save(Project)` | Salvamento explícito de um projeto. Não promove nem apaga o rascunho automaticamente. |
| `load(id)` | Abre o principal; se falhar, tenta cópia anterior válida da mesma identidade. |
| `list()` | Lista projetos, inclusive entradas inválidas identificadas como indisponíveis. Exclui o slot de rascunho. |
| `recover(id)` | Restaura explicitamente a cópia anterior válida. |
| `delete(id)` | Remove principal, cópia anterior e temporários daquela identidade. |
| `saveRecovery(Project)` | Grava o rascunho de recuperação em slot separado. Não altera o salvo explícito. |
| `loadRecovery()` | Abre o rascunho, com alternativa para sua própria cópia anterior; retorna `null` se não houver rascunho comprometido em disco. |
| `hasSavedVersion(id)` | Verifica a existência de principal ou cópia anterior, mesmo ilegíveis. Não é uma validação de conteúdo. |
| `discardRecovery(id, savedExpected)` | Carrega o salvo/backup antes de remover o rascunho quando um salvo é esperado ou seus arquivos existem. Retorna a versão carregada, ou `null` para um rascunho novo sem salvo. Erro de leitura mantém o rascunho. |
| `clearRecovery()` | Apaga apenas o slot de rascunho e seus arquivos auxiliares. |

`LoadResult` contém `project`, `recovered` e `warning`. `recovered=true` significa que o principal falhou e uma cópia anterior foi aberta; a interface deve mostrar o aviso. A leitura não reescreve os arquivos silenciosamente. `ProjectSummary` contém identidade, nome, data, missão, contagem de blocos, flags `recovered`/`corrupt` e aviso.

A escrita usa um temporário no mesmo diretório, sincroniza o conteúdo e substitui o destino por movimento atômico. Antes de substituir o principal, guarda uma cópia **validada** da versão atual. Arquivo principal corrompido nunca substitui uma cópia anterior legítima. Falha de escrita preserva o principal e é informada ao chamador. Temporários incompletos não são tratados como projetos comprometidos.

O Android alvo mínimo é API 26, compatível com o uso de `java.nio.file`. Se o filesystem não aceitar a substituição atômica, o salvamento falha sem rebaixar a garantia para sobrescrita parcial.

A interface decide quando oferecer recuperação e quando limpar o slot: salvar explicitamente, descartar alterações ou sair de um projeto são ações diferentes. Ao excluir um projeto em edição, também deve resolver seu rascunho associado para não oferecê-lo como recuperação depois. Não exibir confirmação de salvamento antes do retorno bem-sucedido de `save`.

Recuperar um rascunho não transforma um projeto salvo em projeto novo. Ao descartar suas alterações, a interface usa `discardRecovery` e restaura o conteúdo salvo; se precisar de uma cópia anterior, conserva o aviso e exige novo salvamento explícito. A escolha **Descartar rascunho** no aviso inicial passa pela mesma validação. Se principal e cópia anterior estiverem corrompidos, a tentativa falha sem apagar a recuperação válida. Um rascunho realmente novo pode ser descartado sem exigir um salvo inexistente.

## 6. Transferências e ciclo de vida da sessão

`ProjectTransfers` é um coordenador Java sem dependências de UI, com uma operação ativa ou um resultado ainda não consumido. Uma segunda operação é recusada até resolver a anterior. Cada operação recebe ID, tipo e token da sessão que a iniciou. Fontes de entrada/saída, destino de importação e dispatcher são interfaces, permitindo testar concorrência sem depender de um provedor Android.

| Etapa | Garantia |
| --- | --- |
| Leitura da importação | Abre e lê no worker; verifica limite e cancelamento antes de cada leitura; fecha a entrada antes de validar e salvar. |
| Validação | Rejeita UTF-8 e JSON inválidos antes de gravar; a importação válida recebe nova identidade. |
| Commit da importação | A transição é sincronizada com o cancelamento. Cancelar antes dela impede a gravação; depois dela, o coordenador aguarda `ProjectStore.save` e não aceita cancelamento. |
| Exportação | Grava um snapshot imutável, verifica cancelamento entre blocos de escrita e só informa sucesso depois de `flush` e `close`. |
| Falha/cancelamento | Importação não iniciada no commit não cria projeto. Exportação pode deixar documento parcial, informado no resultado. Falha de fechamento não produz sucesso. |
| Entrega | O resultado é imutável e consumido uma única vez. Enquanto não consumido, permanece disponível mesmo sem listener. |

O cancelamento marca a operação imediatamente, envia `CancellationSignal` ao provedor e solicita o fechamento do stream fora da thread de interface. Isso não garante um prazo de resposta de qualquer provedor; o coordenador continua ocupado até a tarefa terminar. A finalização verifica novamente o cancelamento para evitar anunciar sucesso de uma exportação cancelada.

Na integração Android, `AndroidDocuments` conserva apenas o resolver da aplicação e a URI. O listener da atividade é associado em `onResume` e removido em `onPause`; callbacks enfileirados consultam o listener atual, sem reter uma atividade destruída. `VoxelWorld` e o coordenador são retidos juntos em mudanças de configuração. O token acompanha o estado salvo da atividade. Um resultado de importação só substitui o editor quando seu token ainda corresponde à sessão atual; caso contrário, o projeto importado permanece salvo em **Projetos**.

O estado retido não sobrevive à morte do processo. Quando o estado restaurado indica transferência interrompida, a interface orienta conferir a lista de projetos e o documento externo, pois a gravação pode ter terminado antes de perder a confirmação. O app não reinicia silenciosamente essa operação. A cópia de recuperação e o projeto salvo continuam sendo os mecanismos persistentes de restauração da construção; o histórico undo/redo completo é preservado apenas na sessão retida.

## 7. Contrato de enquadramento da câmera

`SceneCamera` mantém estado imutável de órbita, zoom relativo e altura de referência. A altura considera os blocos e as posições-alvo da missão, com mínimo de uma unidade. O enquadramento inicial e **Enquadrar construção** incluem o chão inteiro e essa altura, com margem, considerando o menor ângulo útil entre o eixo horizontal e o vertical do viewport. A distância é recalculada quando sua proporção muda.

Órbita e edição não alteram automaticamente a altura capturada: isso evita que a câmera recue a cada bloco colocado. Após crescer além da altura enquadrada, o usuário pode reenquadrar. Zoom manual pode recortar a cena; o teste de enquadramento completo vale para zoom relativo 1. Abrir, importar, recuperar ou criar outro projeto reinicia a vista, sem herdar a câmera da construção anterior.

O estado salvo usa quatro floats: yaw, pitch, zoom relativo e altura de referência. O restaurador também aceita o formato anterior de três valores, convertendo sua distância para zoom relativo. Valores não finitos ou formato inválido retornam ao estado inicial. Esse estado pertence à sessão da interface; não altera o envelope JSON do projeto.

## 8. Vetores de conformidade e ensaios executáveis

`tests/fixtures/voxel-contract.json` contém **36 cenários, 239 operações e seis raios**. Seus resultados são produzidos executando o modelo JavaScript real, não a implementação Java. O gerador verifica o blob Git de referência antes de regenerar:

```sh
node android/tests/generate-voxel-contract.cjs
```

Cada operação registra retorno, contagem, revisão, undo e redo. Cada cenário termina com snapshot e progresso de todas as missões. São cobertos capacidade, bordas, apoio por faces, material, suspensão após remoção, movimento, limite de histórico, carga inválida/duplicada, integridade após falha e objetivos com blocos extras. O mesmo runner confere o `RayPicker` real contra os seis raios e acrescenta direção zero, seleção da face mais próxima e rejeição de objetos atrás do raio.

O runner Java acrescenta snapshots imutáveis e concorrentes, inicialização entre projetos, JSON estrito, identidade de importação, escrita interrompida, cópia de identidade diferente, corrupção UTF-8, rascunho separado, recuperação e exclusão:

```sh
TV_TOUCH_ANDROID_JAR=/caminho/sdk/platforms/android-35/android.jar \
TV_TOUCH_JSON_JAR=/caminho/json-20240303.jar \
bash android/tests/run-core-tests.sh
```

`ProjectTransfersTest` acrescenta **33 asserções** sobre descarte com salvo válido/corrompido, recuperação de cópia anterior, IO fora da thread chamadora, UTF-8 inválido antes da gravação, tamanho excessivo, falha de fechamento, bloqueio de operações concorrentes, cancelamento durante leitura/escrita, cancelamento recusado no commit, consumo único e substituição do listener com preservação do token. Streams e destino de gravação são controlados pelo teste para exercer essas transições.

`CameraFramingContractTest` projeta independentemente **5.376 cantos** do chão e das construções, variando proporção, altura e órbita. Também verifica a regressão de recorte da câmera antiga, zoom, estado inválido e compatibilidade do estado de três valores. Esses cálculos verificam a geometria da câmera usada pelo renderizador, sem executar OpenGL.

O JAR `org.json:json:20240303` é apenas o runtime de teste no host; o aplicativo usa o `org.json` incluído no Android. SHA-256 do JAR de teste: `3cf6cd6892e32e2b4c1c39e0f52f5248a2f5b37646fdfbb79a66b46b618414ed`. Fonte: [Maven Central](https://repo.maven.apache.org/maven2/org/json/json/20240303/json-20240303.jar).

Esses ensaios validam regras, filesystem do host, transições do coordenador com streams controlados e projeção matemática. Não executam `ContentResolver` nem comprovam rotação com um provedor SAF real. Lifecycle Android, UI, SAF, renderização, multitouch e recuperação após encerramento do processo continuam exigindo testes no Android. O Galaxy S25 não homologa o comportamento físico nem o desempenho da WA86F.

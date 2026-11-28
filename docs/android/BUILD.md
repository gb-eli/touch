# Android: arquitetura e compilação do MVP

## Decisão de implementação

O MVP usa Java, Views Android e `GLSurfaceView`/OpenGL ES 2.0. Essa decisão mantém o aplicativo Android nativo, permite compilar e verificar o artefato com a cadeia oficial Android e abre um caminho direto para o SDK ARCore Java/Kotlin. Unity foi considerada durante o planejamento, mas seu editor e ambiente de exportação não estão disponíveis neste executor. Godot está disponível, porém a documentação oficial alerta que seu plugin ARCore para dispositivos portáteis está sem desenvolvimento ativo; adotá-lo apenas pela disponibilidade local transferiria essa dependência para a parte central de RA do produto.

O aplicativo inicial não depende de um site ou WebView para renderizar as atividades. O construtor 3D por toque, seus dados locais e a interface pertencem ao app. A realidade aumentada e a captura de câmera exigem módulos próprios e validação física posterior; a declaração de RA opcional no manifesto não implementa ARCore.

## Alvos e limites

- Namespace: `br.com.agv.touch`.
- Aplicativo de desenvolvimento: `br.com.agv.touch.dev`.
- Nome no launcher da variante de desenvolvimento: `AGV Touch · Teste`.
- Revisão atual: `0.1.1-dev`, código `4` (revisão de controles, enquadramento, recuperação e transferências).
- Android mínimo: API 26. Compilação e alvo: API 35.
- Gráficos: OpenGL ES 2.0 obrigatório; toque e RA não filtram a instalação.
- Fontes Java compatíveis com Java 8; compilação com JDK 17 ou superior.
- Sem permissões de internet, câmera ou microfone nesta primeira configuração.
- Nenhuma biblioteca nativa específica de ABI é empacotada pelo MVP inicial. Isso evita antecipar uma restrição ARM32/ARM64 antes do diagnóstico da WA86F. Plugins futuros podem mudar essa propriedade.

O Samsung Galaxy S25 Ultra é o aparelho de testes portáteis. A Samsung WA86F é o alvo de sala de aula. Instalação, resolução, entrada de toque e desempenho da WA86F precisam de aceite no aparelho real; execução no telefone ou em emulador não substitui essa etapa.

## Sessão, dados e transferências

`MainActivity` coordena a navegação e mantém `VoxelWorld` e `ProjectTransfers` em uma instância retida durante mudanças de configuração. O modelo conserva undo/redo nesse caso. Projeto, ferramenta, material, estado de câmera e identificadores de sessão também são registrados no estado da atividade; a restauração depois da morte do processo não promete recuperar o histórico de edição ou retomar uma transferência externa.

`ProjectTransfers` serializa importação/exportação em um executor dedicado. `AndroidDocuments` cria as fontes SAF usando o `ContentResolver` do contexto da aplicação. Abrir, ler, gravar, descarregar e fechar os streams ocorre fora da thread de interface. A tarefa retida não guarda `Activity` nem `View`; a interface se associa em `onResume` e se desassocia em `onPause`. O resultado fica disponível para consumo único, inclusive quando a atividade é recriada.

Na importação, os bytes passam por decodificação UTF-8 estrita e validação do envelope antes de receber um novo UUID. O coordenador aceita cancelamento durante a leitura e a validação. A entrada na etapa de commit é sincronizada com esse cancelamento: depois de iniciada a gravação local, a interface aguarda a conclusão. A identificação da sessão impede que um resultado tardio substitua outra edição; o projeto importado já salvo continua acessível na lista de projetos.

Na exportação, a tarefa recebe um snapshot textual imutável. Sucesso exige o retorno de escrita, `flush` e `close`. Cancelamento ou erro não remove automaticamente o documento escolhido e informa que o destino pode estar incompleto. O cancelamento envia sinal ao provedor e tenta fechar o stream em um executor separado; sua conclusão depende de o provedor responder. Um processo encerrado pelo sistema pode perder a confirmação de uma gravação já concluída, por isso a restauração orienta conferir os arquivos antes de repetir a ação.

`ProjectStore` mantém salvamento explícito e rascunho separados, com temporário sincronizado, substituição atômica e cópia anterior validada. Descartar um rascunho associado a um salvo exige carregar primeiro uma versão válida desse salvo. Corrupção no principal e na cópia anterior impede o descarte, preservando o rascunho. Operações locais de salvar, recuperar e listar ainda são síncronas; o executor desta revisão cobre as transferências SAF.

O enquadramento vive em `SceneCamera`, independente de Android e OpenGL para permitir ensaios matemáticos. A distância considera as duas dimensões do viewport, o chão e a altura capturada da construção/objetivo. Zoom, órbita e enquadramento são restaurados na rotação; trocar de projeto reinicia a vista. A geometria do enquadramento é testada no host, enquanto legibilidade e resultado visual continuam sujeitos à verificação Android.

## Cadeia de build fixada

| Componente | Versão |
| --- | --- |
| Android Gradle Plugin | 8.9.2 |
| Gradle Wrapper | 8.11.1 |
| SDK Platform | Android 35 |
| SDK Build Tools | 35.0.1 |
| JDK recomendado | 17 ou 21 |

Use um Android SDK preparado para desenvolvimento com os pacotes acima. Defina `ANDROID_HOME` ou crie `android/local.properties` com `sdk.dir` apontando para o SDK local. `local.properties`, diretórios de compilação e chaves são ignorados pelo Git.

```sh
cd android
./gradlew --no-daemon :app:assembleDebug :app:lintDebug
```

O APK de desenvolvimento fica em `android/app/build/outputs/apk/debug/app-debug.apk`. A variante `.dev` pode coexistir com um futuro aplicativo de produção. O APK de desenvolvimento não é uma publicação em loja.

Para verificar assinatura, alinhamento, identidade, SDKs, permissões e ausência de arquivos de chave no pacote:

```sh
python3 tools/verify_apk.py app/build/outputs/apk/debug/app-debug.apk
```

## Contrato de dados e integração contínua

O workflow `.github/workflows/android.yml` executa o contrato entre o modelo Java e o modelo JavaScript existente, os testes de armazenamento, transferências e câmera, build, lint e verificação estática do APK. Ele também regenera a fixture e falha se o resultado divergir do arquivo versionado. As actions estão fixadas por commit.

Os testes JVM usam `org.json:json:20240303` somente como dependência de teste. O aplicativo usa `org.json` do Android; o JAR de testes não é empacotado no APK. O download do CI é conferido contra o SHA-256 `3cf6cd6892e32e2b4c1c39e0f52f5248a2f5b37646fdfbb79a66b46b618414ed`.

O runner `android/tests/run-core-tests.sh` usa fontes reais do domínio e do coordenador, streams controlados e projeções calculadas independentemente da câmera. Ele não exerce `ContentResolver`, janelas Android ou um provedor SAF real. Resultados desses ensaios e a compilação do APK não constituem aceite de rotação com transferência nativa, renderização OpenGL, S25 Ultra ou WA86F. O escopo de cada ensaio está no [contrato do domínio](DOMAIN_CONTRACT.md).

Na primeira execução da PR, o runner tinha os pacotes Android necessários, mas `sdkmanager` não estava no `PATH`. O workflow agora resolve e exporta a raiz do SDK, verifica a plataforma 35 e as ferramentas 35.0.1 e só procura o instalador pelo caminho absoluto se algum pacote estiver ausente. As oito expectativas antigas de cache nos testes web também foram alinhadas a `tvtouch-studio-v3.8.0-tech-news-v2`, valor já presente na `main`; o service worker de produção e as demais asserções foram preservados.

O smoke de navegador também esperava oito atalhos, embora o link TECH NEWS já existisse no commit base `9fda57c` e elevasse o total a nove com o replay de toque. A contagem esperada foi atualizada para nove; as verificações de Arcade único, replay, tamanho dos alvos e alinhamento em uma linha foram mantidas. As duas regras de grade do launcher web legado foram ajustadas para acomodar os nove atalhos na mesma linha, corrigindo a quebra já existente sem alterar o conteúdo.

## Assinatura e distribuição

Gradle usa uma chave de desenvolvimento local. Para isolar a chave deste projeto, defina `AGV_DEBUG_KEYSTORE` com o caminho de um keystore de desenvolvimento, alias `androiddebugkey` e senha padrão de teste `android`. A chave deve permanecer fora do repositório. Não use essa chave de teste para uma publicação de produção.

O APK de teste entregue com esta candidata usa a chave de desenvolvimento do projeto, preservada em backup privado fora do Git. Os artefatos de APK produzidos pelo CI podem ter outro certificado de debug e não substituem automaticamente o APK entregue como uma atualização; preservar a instalação existente exige a mesma assinatura.

O projeto não inclui credenciais de produção nem uma configuração que publique automaticamente. A assinatura de produção, o canal de distribuição e a política de atualizações são decisões posteriores.

Builds de desenvolvimento precisam usar a mesma chave para atualizar uma instalação existente. Os runners novos do CI geram chaves de teste próprias; um APK de outro runner pode exigir reinstalação. Exporte as construções antes de trocar para um build assinado por outra chave. Uma futura versão de produção usará identidade e assinatura próprias.

## Verificação física antes de liberar para a escola

Confirmar instalação e abertura, salvamento após encerrar o app, reabertura sem rede, desfazer/refazer, uso simultâneo de contatos, recuperação após suspensão, rotação/redimensionamento e estabilidade em uma sessão de aula. Registrar aparelho, Android, versão do app e resultado observado, sem imagens de estudantes.

## Fontes técnicas

- [Compatibilidade do Android Gradle Plugin 8.9](https://developer.android.com/build/releases/agp-8-9-0-release-notes).
- [Guia oficial ARCore Java/Kotlin com OpenGL](https://developers.google.com/ar/develop/java/quickstart).
- [Estado do plugin ARCore na documentação Godot](https://docs.godotengine.org/en/latest/tutorials/xr/arcore_intro.html).
- [Exportação Android no Godot](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_android.html).

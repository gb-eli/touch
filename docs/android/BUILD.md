# Android: arquitetura e compilação do MVP

## Decisão de implementação

O MVP usa Java, Views Android e `GLSurfaceView`/OpenGL ES 2.0. Essa decisão mantém o aplicativo Android nativo, permite compilar e verificar o artefato com a cadeia oficial Android e abre um caminho direto para o SDK ARCore Java/Kotlin. Unity foi considerada durante o planejamento, mas seu editor e ambiente de exportação não estão disponíveis neste executor. Godot está disponível, porém a documentação oficial alerta que seu plugin ARCore para dispositivos portáteis está sem desenvolvimento ativo; adotá-lo apenas pela disponibilidade local transferiria essa dependência para a parte central de RA do produto.

O aplicativo inicial não depende de um site ou WebView para renderizar as atividades. O construtor 3D por toque, seus dados locais e a interface pertencem ao app. A realidade aumentada e a captura de câmera exigem módulos próprios e validação física posterior; a declaração de RA opcional no manifesto não implementa ARCore.

## Alvos e limites

- Namespace: `br.com.agv.touch`.
- Aplicativo de desenvolvimento: `br.com.agv.touch.dev`.
- Nome no launcher da variante de desenvolvimento: `AGV Touch · Teste`.
- Versão inicial: `0.1.0-dev`, código `3` (candidata com contraste dos diálogos corrigido).
- Android mínimo: API 26. Compilação e alvo: API 35.
- Gráficos: OpenGL ES 2.0 obrigatório; toque e RA não filtram a instalação.
- Fontes Java compatíveis com Java 8; compilação com JDK 17 ou superior.
- Sem permissões de internet, câmera ou microfone nesta primeira configuração.
- Nenhuma biblioteca nativa específica de ABI é empacotada pelo MVP inicial. Isso evita antecipar uma restrição ARM32/ARM64 antes do diagnóstico da WA86F. Plugins futuros podem mudar essa propriedade.

O Samsung Galaxy S25 Ultra é o aparelho de testes portáteis. A Samsung WA86F é o alvo de sala de aula. Instalação, resolução, entrada de toque e desempenho da WA86F precisam de aceite no aparelho real; execução no telefone ou em emulador não substitui essa etapa.

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

O workflow `.github/workflows/android.yml` executa o contrato entre o modelo Java e o modelo JavaScript existente, os testes de armazenamento, build, lint e verificação estática do APK. Ele também regenera a fixture e falha se o resultado divergir do arquivo versionado. As actions estão fixadas por commit.

Os testes JVM usam `org.json:json:20240303` somente como dependência de teste. O aplicativo usa `org.json` do Android; o JAR de testes não é empacotado no APK. O download do CI é conferido contra o SHA-256 `3cf6cd6892e32e2b4c1c39e0f52f5248a2f5b37646fdfbb79a66b46b618414ed`.

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

# Teste de atualização dentro do TV Touch — 0.2.0 → 0.2.1

## O que foi preparado
- Aplicativo 0.2.1-dev: `versionCode 7`; `applicationId br.com.agv.touch.dev`.
- O 0.2.0-dev já contém o menu **Ajustes → Atualizações do aplicativo**.
- Na 0.2.1, a página Início ganha um aviso quando há atualização disponível, com acesso aos Ajustes.
- Compilação e testes de domínio: [Android MVP workflow #39](https://github.com/gb-eli/touch/actions/runs/46151615348), aprovados.
- A primeira publicação deve usar o APK assinado no mesmo certificado do 0.2.0:
  - APK: `TV_TOUCH_STUDIO_0.2.1_Android.apk`
  - Arquivo: **119261 bytes**
  - SHA-256: `c04309fa4ac80a41a06c80b178df27399c565073a1f1afb5db2a5bf88737e9b1`
  - Certificado SHA-256: `a9154ab40c8744eab6d110cd1371686a85ed394ed9a35bf876a30becdf5eaf0a`
  - `apksigner` oficial confirmou **v2: Verifies**.
- O certificado de desenvolvimento **nunca** deve ser publicado em Git nem anexado ao release.

## Por que o botão não encontra atualização ainda?

O catálogo [dev.json](https://github.com/gb-eli/touch/blob/main/docs/android/updates/dev.json) permanece deliberadamente com `apkUrl` vazio. O app não pode baixar o APK a partir de um arquivo temporário do ChatGPT: ele precisa de uma URL HTTPS estável no GitHub Releases. O catálogo só deve ser ativado **depois** que o release assinado existir, para evitar downloads inválidos.

## Publicador automático (opção recomendada para manutenção)

O workflow [Publish TV Touch in-app update (0.2.1)](https://github.com/gb-eli/touch/actions/workflows/publish-tv-touch-update.yml), já presente em `main`, faz:

1. Compilar a versão `app/studio-0.2.1-update-test`.
2. Assinar com a chave de desenvolvimento já utilizada na 0.2.0, fornecida como **GitHub Actions secret**.
3. Conferir identidade, versionCode, assinatura v2 e certificado SHA-256 esperado.
4. Criar release **v0.2.1-dev** (pré-lançamento), sem sobrescrever versões existentes.
5. Baixar novamente o anexo e conferir SHA-256.
6. Atualizar o `main/docs/android/updates/dev.json` apenas após a publicação ser verificada.

**Preparação única do segredo:** no repositório GitHub, abra **Settings → Secrets and variables → Actions → New repository secret**. Nome exato: `TV_TOUCH_DEV_KEYSTORE_B64`. Valor: conteúdo do `dev-signing.p12` codificado em Base64 — calculado localmente em máquina de confiança. No Windows PowerShell, após extrair o arquivo privado:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\CAMINHO_PRIVADO\dev-signing.p12")) | Set-Clipboard
```

Cole **somente no campo do segredo GitHub**. Não cole no chat, não envie por e-mail, não comite no repositório. A senha e o alias continuam sendo os de desenvolvimento do projeto; a chave privada nunca sai para o release. Depois de registrar o segredo, abra **Actions → Publish TV Touch in-app update (0.2.1) → Run workflow** e aguarde a indicação verde. Se o repositório restringir escrita pelo `GITHUB_TOKEN`, a etapa final poderá exigir ajustes em permissões/branch protection.

## Alternativa sem enviar chave para o GitHub

O proprietário também pode criar manualmente um prerelease `v0.2.1-dev` no GitHub, direcionado ao commit de `app/studio-0.2.1-update-test`, e anexar **somente** o APK já assinado entregue na conversa, chamado exatamente `TV_TOUCH_STUDIO_0.2.1_Android.apk`.

Depois de confirmar o download público do anexo e verificar bytes e SHA-256, publique o feed abaixo em `main/docs/android/updates/dev.json`:

```json
{
  "schema": 1,
  "packageName": "br.com.agv.touch.dev",
  "versionCode": 7,
  "versionName": "0.2.1-dev",
  "minSdk": 26,
  "notes": "Aviso de atualização na tela inicial e orientações de instalação mais claras. Mantém o Studio Prism e os projetos salvos.",
  "apkUrl": "https://github.com/gb-eli/touch/releases/download/v0.2.1-dev/TV_TOUCH_STUDIO_0.2.1_Android.apk",
  "sizeBytes": 119261,
  "sha256": "c04309fa4ac80a41a06c80b178df27399c565073a1f1afb5db2a5bf88737e9b1"
}
```

**Nunca** publique esse catálogo antes do release e da conferência do anexo. A URL, os bytes e o hash precisam corresponder ao arquivo publicado.

## Teste de ponta a ponta no S25 Ultra

1. **Mantenha instalada a 0.2.0**, sem desinstalar.
2. Confirme que o release pré-lançamento e o catálogo estão ativos.
3. No celular conectado, abra o app em **Ajustes → Atualizações do aplicativo → Verificar atualizações** (a checagem automática pode estar em cache por até 24h).
4. O app deve oferecer a **0.2.1-dev** com novidades; confirme o download.
5. Aguarde a validação de SHA-256, tamanho, assinatura e pacote.
6. Se solicitado, autorize a instalação de APK dessa origem; no instalador do Android, escolha **Atualizar**.
7. Abra o app e confira versão **0.2.1-dev**, projetos, favoritos, modelos e rascunhos.
8. Registre diagnóstico ou captura de tela; na escola repita a aceitação na Samsung WA86F.

Se o Android pedir **desinstalar** em vez de **atualizar**, cancele. A atualização não pode apagar projetos.

## Estado honesto

O código e o APK 0.2.1 estão prontos e assinados, mas **a disponibilização pelo próprio aplicativo depende da publicação do release e do catálogo**. A instalação in-app ainda não foi validada fisicamente. O repositório base do app e a página pública não precisam ser substituídos para testar o canal.

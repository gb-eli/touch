# TV Touch Android 0.1.2-dev — instalação e publicação do canal de atualizações

## Pacote assinado para atualização da 0.1.1

- Arquivo entregue na conversa: `TV_TOUCH_MVP_0.1.2_Android.apk`
- Pacote: `br.com.agv.touch.dev`
- Versão: `0.1.2-dev` (`versionCode=5`)
- SHA-256 do APK: `4da05c37542b523c42bf285b3d2d4674b81688b5753225fd7964c17a237669d2`
- Tamanho: `109541` bytes
- SHA-256 do certificado: `a9154ab40c8744eab6d110cd1371686a85ed394ed9a35bf876a30becdf5eaf0a`
- Origem do código compilado: workflow Android [#15](https://github.com/gb-eli/touch/actions/runs/46148027488), revisão `d50209b55c2f32faaa11297fdba6d3d5311b4a6b`.
- Assinado **fora do repositório** com a mesma chave de desenvolvimento da 0.1.1. A assinatura APK Signature Scheme v2 foi conferida com o `apksigner` oficial, que reportou `Verifies`. Todas as 11 entradas ZIP permaneceram idênticas à build da CI após a troca do bloco de assinatura. **O APK não foi instalado fisicamente no S25 Ultra ou na WA86F nesta revisão.**

**Não desinstale a 0.1.1.** Instale o novo APK sobre a versão existente. Se o instalador recusar a atualização, não desinstale: registre a mensagem e exporte os projetos em JSON antes de qualquer migração de identidade ou certificado.

## Publicação do APK de teste

O GitHub App conectado permite alterações de código, mas **não oferece nesta integração um comando para anexar arquivos binários a GitHub Releases**. Portanto, o APK foi entregue como arquivo da conversa; o release hospedado no GitHub **ainda precisa de upload manual pelo proprietário**.

1. Abra **github.com/gb-eli/touch/releases/new** com sua conta.
2. Escolha a tag `v0.1.2-dev`, título **TV Touch 0.1.2-dev — atualizações internas**. Marque como *pre-release*.
3. Anexe **exatamente** `TV_TOUCH_MVP_0.1.2_Android.apk` e publique.
4. Confira o download e o SHA-256 do arquivo do release.
5. Não envie o backup da chave de assinatura, nenhum `.keystore`, senha ou chave privada.

A versão 0.1.2 já contém o cliente de atualização. O catálogo em `main/docs/android/updates/dev.json` começa com `apkUrl` vazio de propósito: o app não deve oferecer um APK inexistente. **Depois de publicar a próxima versão com versionCode maior que 5 e a mesma assinatura**, atualize o catálogo com os dados verificados:

```json
{
  "schema": 1,
  "packageName": "br.com.agv.touch.dev",
  "versionCode": 6,
  "versionName": "0.1.3-dev",
  "minSdk": 26,
  "notes": "Resumo das melhorias verificadas.",
  "apkUrl": "https://github.com/gb-eli/touch/releases/download/v0.1.3-dev/TV_TOUCH_MVP_0.1.3_Android.apk",
  "sizeBytes": 123456,
  "sha256": "SUBSTITUA_PELO_SHA256_REAL_DE_64_CARACTERES"
}
```

O exemplo acima **não deve ser publicado sem substituir tamanho, URL e SHA-256 pelos dados reais** do APK final assinado. O feed somente pode anunciar uma versão maior que a instalada; um versionCode igual ou menor não gera aviso de atualização. Confira também `minSdk` e suporte ao aparelho.

## Teste do mecanismo no S25 Ultra

1. Atualize 0.1.1 para 0.1.2 usando o arquivo assinado entregue no chat. Não desinstale.
2. Abra **Projetos** e confira o conteúdo anterior.
3. Abra **Ajustes → Atualizações do aplicativo → Verificar atualizações** com internet. Enquanto não houver próximo release publicado, o status explicará que o canal ainda não oferece APK.
4. Publique o release de uma **versão posterior**, com `versionCode` maior, e atualize o catálogo.
5. Verifique novamente; confira versão e novidades, baixe e confirme a instalação no instalador do Android.
6. Reabra o app e verifique versão instalada, projetos, rascunhos e a jornada de construção.
7. Repita os testes de instalação e política do aparelho na WA86F, quando ela estiver disponível.

**Limitação:** a verificação do sistema por si só não testa política de instalação na WA86F, rede escolar, download de releases nem persistência no S25 Ultra. O fluxo de instalação precisa de aceite físico. A atualização não remove arquivos do projeto explicitamente, mas a continuidade dos dados depende da instalação *in-place* com mesmo applicationId e assinatura. Caso o Android ofereça remover o aplicativo para instalar, recuse e investigue.

## Política de distribuição

O atualizador direto de APK é exclusivo da variante `.dev` distribuída fora da Play Store, com consentimento explícito. Uma versão de produção distribuída pela Google Play deve usar o mecanismo de atualização da loja e não reutilizar este fluxo de autoatualização com `REQUEST_INSTALL_PACKAGES`.


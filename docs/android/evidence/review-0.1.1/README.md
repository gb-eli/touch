# Evidências da revisão Android 0.1.1

Esta pasta reúne a revisão em emulador AOSP API 28/x86, com renderização SwiftShader. Os ensaios usam projetos descartáveis e não representam aceite físico no Galaxy S25 Ultra ou na Samsung WA86F.

## Identificação das candidatas

Os prefixos registram as etapas de ensaio. A candidata entregue é **code4c**, que inclui as correções de fonte ampliada e seleção de JSON.

| Prefixo | Versão/código | SHA-256 do APK | Uso |
| --- | --- | --- | --- |
| `code3` | 0.1.0-dev / 3 | `e4de26fd1c7a06feced4a4cae7a40bb4d4bac58e26453c9d1bd32ab66d67d28d` | Referência anterior e preparação do ensaio de atualização. |
| `code4` | 0.1.1-dev / 4 | `2fef53a4b42d3fed6b50002bfb072e99862a5607d5f4020856c4d77fb30232c3` | Recuperação, descarte e comparação em paisagem; identificou compressão com fonte ampliada. |
| `code4b` | 0.1.1-dev / 4 | `68a53239dcf0828f2939c226993c9800c37f9013a5297636b6943f86ff63564b` | Corrigiu fonte ampliada; edição e rotação; identificou JSON desabilitado no seletor. |
| `code4c` | 0.1.1-dev / 4 | `392cceaf1f3a0672b28d29e4d0da5654562f74b696181a3b8be555200e96d782` | Corrigiu o filtro do seletor mantendo a validação estrita do conteúdo. |

O certificado de desenvolvimento permaneceu `a9154ab40c8744eab6d110cd1371686a85ed394ed9a35bf876a30becdf5eaf0a`. A chave privada não está nesta pasta nem no repositório.

## Como interpretar as evidências

- [Verificação do APK](apk-verification.json): identidade, hash, versão, assinatura, alinhamento, permissões e ausência de chaves no pacote.
- [Roteiro executado](native-qa.json): resultado e escopo de cada ensaio, com a candidata correspondente.
- [Preparação da atualização](update-setup.json): salvo de um bloco e rascunho de dois, criados como fixtures válidas com o app parado. Esse setup não é uma alegação de criação pela UI nesta rodada.
- [Preservação na atualização](code4-update-preservation.json): hashes antes/depois; capturas de recuperação e descarte mostram a jornada real na interface.
- [Paisagem curta](code4-short-landscape-metrics.json): mesma resolução 1600 × 720, densidade 280 e fonte 100%. O palco passou de 184 para 568 px de altura; o ganho de 3,09× se refere à altura.
- [Fonte ampliada antes](code4-phone-360dp-font150-metrics.json) e [depois](code4b-phone-360dp-font150-metrics.json): largura lógica 360 dp e fonte 150%; confirmação passou a usar a largura completa e uma linha de texto.

Arquivos PNG mostram o estado visual; XMLs adjacentes guardam textos, alvos e limites expostos pela UI. A sequência de importação distingue o arquivo de teste preparado no armazenamento da seleção e leitura efetivamente realizadas pelo seletor Android.

As evidências do [protótipo em Chrome](../../../app-design/evidence/review-0.1.1/) são separadas da execução nativa. Os testes de streams no host cobrem falhas e cancelamento controlados; esses resultados não demonstram o comportamento de todos os provedores SAF, nem garantem um prazo de cancelamento de um provedor lento.

Durante alterações da configuração do emulador houve um aviso do SystemUI. O relatório registra esse evento do ambiente sem atribuí-lo ao aplicativo. A validação física, multitouch e uso sustentado seguem o [roteiro de aceite](../../ACCEPTANCE.md).

# Evidências do MVP Android e dos protótipos

Este diretório registra o que foi efetivamente verificado no MVP `0.1.0-dev`. O pacote entregue é `br.com.agv.touch.dev`, código de versão **3**, nome no launcher **AGV Touch · Teste**. O identificador da árvore Git Android e o SHA-256 do APK estão em [apk-verification.json](apk-verification.json).

## Como ler os resultados

- [native-qa.json](native-qa.json) identifica cada ensaio Android, a candidata usada, o resultado e seus arquivos de evidência. Os projetos chamados `QA_Nativo_01` são dados descartáveis de teste.
- [validation-summary.json](validation-summary.json) reúne compilação, lint, contrato de dados e regressão do site.
- [Relatório do protótipo](../../app-design/evidence/prototype-qa.json) pertence ao HTML de alta fidelidade. Ele não representa execução do APK.
- [ACCEPTANCE.md](../ACCEPTANCE.md) contém o roteiro ainda pendente no Galaxy S25 Ultra e na Samsung WA86F físicos.

## Execução nativa observada

O ambiente funcional foi um **emulador AOSP Android API 28, x86, renderização SwiftShader por software**. Foram usadas janelas de telefone e uma janela larga. Isso permite conferir a interface e a persistência, mas não mede desempenho, alcance dos comandos ou capacidades da WA86F e do S25 Ultra.

| Ensaio | Resultado observado |
| --- | --- |
| Abrir e construir | Início e construtor renderizados; selecionar uma posição manteve zero blocos, e confirmar criou um bloco. |
| Desfazer e refazer | Contagem mudou de um para zero e voltou a um. |
| Salvar e reabrir | Projeto salvo com nome e um bloco; após encerrar o processo e relançar, reapareceu com os mesmos dados. |
| Atualização de versão | Instalação da candidata 2 sobre a 1 preservou separadamente o projeto salvo de um bloco e o rascunho de dois blocos. A igualdade dos arquivos foi conferida. |
| Recuperação | O app ofereceu o rascunho; recuperar mostrou as edições ainda não salvas. A candidata 3 também recuperou o rascunho após a atualização. |
| Rotação na candidata 3 | Quatro blocos permaneceram após a rotação; Desfazer levou a três e Refazer retornou a quatro. |
| Contraste | A candidata 2 tinha rótulos escuros no diálogo de coordenadas. A candidata 3 corrigiu a cor e o resultado foi conferido por captura. A falha original permanece registrada para rastreabilidade. |
| Tela larga e controles inferiores | Em 1600 × 720, densidade 160, Salvar projeto abriu o diálogo e salvou quatro blocos; Voltar retornou ao Início com navegação lateral. |

O relatório terminou com **13 ensaios aprovados, zero falhas abertas e três não executados**: a combinação briefing/rotação, importação/exportação pelo seletor Android e contraste do painel de resultado de missão. Multitoque físico, caneta e sessões longas também dependem do aceite nos aparelhos. Os testes de domínio validam os dados, mas não substituem o seletor de arquivos real.

Capturas da candidata final: [Início em tela larga](native-code3-home-wide-final.png), [Construtor em tela larga](native-code3-builder-wide-final.png), [Construtor em retrato](native-code3-builder-portrait.png) e [Coordenadas com contraste corrigido](native-code3-coordinate-contrast-fixed.png).

Uma primeira imagem de emulador API 35 apresentou falhas de sistema, incluindo SystemUI/Launcher, e não produziu uma sessão de interface utilizável. Ela foi descartada como evidência funcional. Não há alegação de teste físico ou de desempenho sustentado baseada nessa tentativa.

## Compilação e verificações automáticas

O Gradle concluiu `assembleDebug` e `lintDebug`. O lint apresentou **zero erros e 18 avisos**: seis `DrawAllocation`, seis `SetTextI18n`, quatro `ViewConstructor`, um `ObsoleteSdkInt` e um `MonochromeLauncherIcon`. O compilador Java também informa avisos de compatibilidade/depreciação; não são falhas de compilação. Otimização gráfica, recursos de texto e acabamento adicional podem ser tratados após a avaliação nos aparelhos.

A verificação estática confirmou identidade, Android mínimo/alvo, assinatura, alinhamento e ausência de permissões. O APK não contém chaves privadas nem bibliotecas `.so`. A chave de desenvolvimento permanece fora do repositório; artefatos produzidos por outros ambientes podem ter assinatura diferente.

O contrato Java reproduziu **36 cenários e 239 operações do modelo JavaScript existente**. Há ensaios adicionais de JSON estrito, snapshots, concorrência, gravação atômica, recuperação, corrupção, identidade e seis vetores de seleção 3D do modelo legado. Os detalhes estão em [DOMAIN_CONTRACT.md](../DOMAIN_CONTRACT.md).

Na regressão do site, **110 testes Node** e **120 verificações de navegador em sete perfis** passaram. Foi necessário alinhar expectativas de cache ao valor já existente na `main` e acomodar os nove atalhos existentes do launcher. As asserções de alinhamento, tamanho dos alvos e ausência de duplicação foram mantidas. Esses testes cobrem o site e não certificam o APK em uma TV real.

## Limite desta entrega

O MVP implementa construção 3D por toque, quatro missões e projetos locais. **Câmera, realidade aumentada, rastreamento de mãos/corpo e VR não foram implementados.** A preferência de 30/60 FPS é uma meta de renderização, sem garantia de desempenho. O aceite físico do S25 Ultra e da WA86F segue pendente.

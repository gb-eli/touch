# Aceite do TV Touch Android — MVP 0.1.1-dev

## Estado e identificação

Este documento define os ensaios do aplicativo `br.com.agv.touch.dev`. As caixas abaixo são **pendências**, não resultados executados. Registrar a build e as observações antes de marcar um item como aprovado.

| Ambiente | Estado deste registro |
| --- | --- |
| Contrato do domínio e filesystem do host | Executado: 36 cenários, 239 operações comparadas ao JS legado, testes adicionais de JSON/persistência/concorrência e picking. Detalhes em [DOMAIN_CONTRACT.md](DOMAIN_CONTRACT.md). |
| APK em Android/emulador | Execução nativa registrada em emulador AOSP API 28/x86 com SwiftShader. Consultar [native-qa.json](evidence/native-qa.json) para o estado atualizado, a versão testada e as evidências de cada ensaio; esse registro não substitui o aceite físico. |
| Galaxy S25 Ultra físico, em casa | **Pendente.** |
| Samsung WA86F física, na escola | **Pendente.** |
| Câmera, RA, reconhecimento corporal/mãos e VR | Não implementados no MVP; fora do aceite funcional desta versão. |

Build e instalação seguem [BUILD.md](BUILD.md). Arquitetura atual: Java, Views Android e OpenGL ES 2.0. O planejamento anterior de Unity não descreve o binário deste MVP.

### Registro de cada execução

Preencher versão do APK, commit de origem, hash do arquivo, identidade do app, aparelho, Android, data, perfil visual e executor do teste. Para ensaios gráficos, registrar janela, renderizador, limite de FPS configurado, número de blocos, duração e resultado observado.

Classificações: **Não executado**, **Aprovado**, **Reprovado** ou **Bloqueado**. Um bloqueio de instalação ou acesso ao dispositivo não equivale a reprovação das regras do projeto. Não registrar nomes ou imagens de alunos.

## 1. Preparação e preservação dos projetos

- [ ] Identificar o APK como `0.1.1-dev` (versionCode `4`), `br.com.agv.touch.dev`, antes da instalação.
- [ ] Exportar JSON dos projetos existentes antes de reinstalar, trocar assinatura ou migrar de identidade de app.
- [ ] Usar a mesma chave de teste para o ensaio de atualização. A chave permanece fora do repositório.
- [ ] Preparar um JSON legado válido, um inválido e uma exportação desta versão para os testes de migração.
- [ ] Instalar pelo procedimento permitido no aparelho; registrar eventual impedimento de administração da escola.
- [ ] Confirmar que o aplicativo abre sem solicitar câmera, microfone ou login.

## 2. Galaxy S25 Ultra — roteiro em casa

| ID | Ação | Resultado esperado | Estado |
| --- | --- | --- | --- |
| H01 | Abrir Início, Explorar, Projetos e Ajustes. | Navegação disponível; textos e comandos respeitam a área útil da tela. | Pendente |
| H02 | Começar construção livre; escolher material, tocar uma posição e confirmar. | Prévia e confirmação distintas; um bloco por edição, com material escolhido. | Pendente |
| H03 | Usar Girar, pinça e controles de câmera. | Vista muda sem criar/remover blocos acidentalmente. | Pendente |
| H04 | Apagar, desfazer e refazer. Repetir com S Pen como entrada na tela. | Operações preservam posições/materiais e o histórico esperado. | Pendente |
| H05 | Completar Torre, Escadaria, Ponte e Simetria. | Contagem e conclusão correspondem a 5, 6, 5 e 6 posições-alvo; material não restringe a conclusão. | Pendente |
| H06 | Salvar com nome, fechar o app e reabrir. | Projeto recuperado em Projetos, com construção e missão corretas. | Pendente |
| H07 | Renomear, exportar e importar uma cópia. | Nome atualizado; importação cria outro projeto, preservando o original. | Pendente |
| H08 | Iniciar sem rede e editar/salvar projeto local. | Núcleo continua utilizável. Usar destino local no seletor de arquivos. | Pendente |
| H09 | Alterar perfis Celular/TV/Automático. | Ajustes de apresentação observáveis; TV aumenta alvos e só usa menu lateral quando há espaço. Capacidades não são alteradas. | Pendente |
| H10 | Usar uma cena identificada por 20 minutos. | Registrar estabilidade, fluidez, aquecimento e últimas amostras de FPS. O limite configurado não é tratado como FPS medido. | Pendente |
| H11 | Instalar uma build posterior com identidade/assinatura compatíveis. | Projetos existentes preservados e abertos após a atualização. | Pendente |

O S25 valida apenas os fluxos observados nesse telefone e nessa build. Simular perfil TV no telefone não mede alcance físico, caneta, contatos, renderização ou ergonomia da WA86F.

## 3. Samsung WA86F — roteiro na escola

Executar no Android interno da tela em que o app será utilizado. Uma demonstração espelhada do telefone não comprova execução nativa na WA86F.

| ID | Ação | Resultado esperado | Estado |
| --- | --- | --- | --- |
| E01 | Instalar, abrir e consultar Ajustes/Diagnóstico. | Registrar Android, arquiteturas, janela e GPU. Identificar qualquer bloqueio de instalação ou cena. | Pendente |
| E02 | Verificar navegação e construtor na tela de 86 polegadas. | Comandos legíveis e alcançáveis; saída e salvamento visíveis; cena sem controles essenciais encobertos. | Pendente |
| E03 | Usar toque, caneta, arraste e pinça. Observar 2 e 4 contatos quando disponíveis. | Gestos não ficam presos e não provocam edição acidental; registrar contatos efetivamente observados. | Pendente |
| E04 | Abrir o mesmo JSON usado no S25 e concluir uma missão. | Coordenadas, materiais e objetivo reproduzidos sem depender do aparelho de origem. | Pendente |
| E05 | Salvar, suspender, retomar e reiniciar sem rede. | Construção recuperável; núcleo offline utilizável. | Pendente |
| E06 | Executar cena padronizada por 20 minutos. | Registrar quantidade de blocos, limite solicitado, amostras de FPS e falhas. Ajustar metas apenas com justificativa registrada. | Pendente |
| E07 | Atualizar com identidade/assinatura compatíveis. | Projetos e preferências preservados. | Pendente |
| E08 | Conferir informação sobre câmera/RA. | Interface explica que captura e RA não foram implementadas. Indicação de câmera pelo sistema não é aprovação de webcam ou reconhecimento corporal. | Pendente |

O aceite de webcam USB e reconhecimento corporal terá roteiro próprio quando houver captura implementada. USB, Android e o perfil TV não demonstram, isoladamente, que uma câmera externa pode ser usada pelo aplicativo.

## 4. Regressões de sessão, dados e arquivos

Executar em Android/emulador e repetir os fluxos essenciais no aparelho real. Ensaios que corrompem arquivos usam **somente projetos descartáveis em instalação de teste**, depois da exportação de qualquer criação relevante.

| ID | Reprodução | Resultado esperado | Estado |
| --- | --- | --- | --- |
| R01 | Adicionar dois blocos, mudar material/ferramenta e girar o aparelho. | Construção, missão, câmera, material e ferramenta mantidos; Desfazer continua disponível. | Pendente |
| R02 | Salvar projeto livre, abrir briefing da Ponte, girar e voltar para Continuar projeto. | Projeto continua livre; pré-visualização de missão não altera sua missão persistida. | Pendente |
| R03 | Editar, usar Voltar e escolher Continuar editando, Salvar ou Descartar em ensaios separados. | Cancelar preserva edição; salvar confirma após escrita; descartar retorna ao último salvo ou encerra o projeto novo conforme a escolha. | Pendente |
| R04 | Editar um projeto de teste e encerrar seu processo; abrir novamente. | Rascunho oferecido separadamente do salvo explícito; usuário decide recuperar ou descartar. | Pendente |
| R05 | Tornar ilegível o rascunho principal, preservando sua cópia anterior válida. | Diálogo informa **cópia anterior** e apresenta aviso; não promete recuperar a última edição corrompida. | Pendente |
| R06 | Com rascunho válido, tornar ilegíveis principal e backup do salvo; solicitar Descartar no diálogo inicial e, em ensaio separado, após recuperar no editor. | Falha é informada e o rascunho é preservado, pois a substituição não pôde ser preparada. | Pendente |
| R07 | Provocar falha de limpeza do rascunho após uma gravação explícita bem-sucedida. | App reconhece que o projeto foi salvo; eventual aviso de limpeza não transforma sucesso em perda de dados. | Pendente |
| R08 | Cancelar o seletor de importação/exportação; repetir com arquivo inválido, destino indisponível ou permissão revogada. | Sem falsa confirmação; projeto atual e arquivos anteriores preservados. | Pendente |
| R09 | Exportar projeto, importar duas vezes e verificar a lista. | Três identidades distintas: original e duas cópias. UUID recebido não substitui outro projeto. | Pendente |
| R10 | Tentar importar coordenada ausente, string numérica, duplicata, material desconhecido e mais de 256 blocos. | Todos rejeitados sem modificar projeto em edição ou salvo. | Pendente |
| R11 | Excluir projeto e cancelar primeiro; depois confirmar em projeto descartável. | Cancelar mantém os dados; confirmar remove projeto e cópia anterior, com estado da sessão coerente. | Pendente |
| R12 | Entrar/sair do construtor dez vezes e alternar com outro app. | Cena retoma; controles respondem; ausência de travamentos ou gestos presos observáveis. | Pendente |
| R13 | Importar/exportar com provedor lento, girar durante a operação e cancelar antes do salvamento da importação. | Tela responde; estado da operação reaparece após rotação; resultado consumido uma vez. Cancelamento informa eventual destino parcial na exportação. | Pendente |
| R14 | Abrir construtor de missão em paisagem curta, depois em retrato estreito com fonte ampliada. | Cena utilizável; confirmação, desfazer e refazer alcançáveis; sem texto ilegível por compressão. | Pendente |
| R15 | Enquadrar uma construção alta e girar entre retrato/paisagem. | Grade e altura da construção cabem na vista enquadrada; zoom manual permanece ajustável. | Pendente |

O teste de fechamento de processo é diferente da rotação. Na rotação, o modelo em memória preserva o histórico. Após encerramento do processo, a recuperação assegura a construção gravada no rascunho; histórico completo, seleção transitória e estado de um diálogo não são prometidos como dados persistidos.

## 5. Decisão por build e aparelho

Marcar o núcleo como aprovado somente após instalação, edição, persistência e recuperação essenciais sem perda de dados. Registrar defeitos de layout/desempenho com o aparelho, modo e reprodução. Se um item falhar, manter sua evidência e o estado Reprovado/Bloqueado até nova execução.

| Recurso | S25 Ultra | WA86F |
| --- | --- | --- |
| Instalação e navegação | Pendente | Pendente |
| Construção 3D e quatro missões | Pendente | Pendente |
| Toque/caneta e gestos | Pendente | Pendente |
| Projetos, importação/exportação e recuperação | Pendente | Pendente |
| Atualização preservando dados | Pendente | Pendente |
| Uso sustentado | Pendente | Pendente |
| Câmera/RA/corpo/VR | Não implementado nesta versão | Não implementado nesta versão |

Publicação em loja, assinatura de produção e substituição do site não são resultados deste checklist. O pacote atual é uma versão de desenvolvimento para validar o MVP e orientar a próxima entrega.

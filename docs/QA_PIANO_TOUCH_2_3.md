# Validação do piloto Studio 2.3 — Piano Touch

## Escopo proposto
- Novo módulo: public/experiences/piano/index.js, com CSS próprio e suporte a 24 notas em duas oitavas.
- Host modular: public/js/experience-host.js, com import dinâmico e ciclo de vida.
- Ponto de entrada em Home e Laboratório; rota #piano.
- Áudio Web Audio, teclas pointerId, acordes, três timbres, volume, mute, feedback e reinício.

## Testes executados
- Sintaxe validada em scripts alterados, host e serviço PWA.
- Teste simulado de evento DOM + Web Audio (mocks em JavaScript):
  1. geração de 24 teclas;
  2. Dó–Mi–Sol simultâneos: 3 vozes e 1 evento de conclusão;
  3. pointerup: 3 stops;
  4. ativação de mute: nenhuma voz nova;
  5. visibilitychange: vozes encerradas;
  6. unmount: AudioContext fechado, interface desmontada.
- Testes adicionais: deslize entre teclas encerra nota anterior sem duplicar voz; teclado físico dispara e solta a nota corretamente.
- **5/5** cenários simulados passaram com DOM e Web Audio substituídos por mocks; não é ensaio físico.
- Teste de navegador real na Samsung WA86F: **pendente**.
- Integração Supabase: não realizada; política do Laboratório respeitada no acesso à rota.
- Pacote do piano e host pré-armazenados pelo PWA (poucos KB) para funcionar após instalação offline, sem carregar execução Web Audio na home.

## Limitações e QA necessário
- A simulação verifica contratos JavaScript, **não a latência de som, compatibilidade de Web Audio, toque IR e rendering real da TV**.
- Testar 2/3/5 toques reais e arraste lateral entre teclas; verificar se existem eventos duplicados na WA86F.
- Testar diferenças entre ponteiro da caneta, toque e mouse.
- Medir tempo de carregamento, qualidade de áudio e aquecimento durante 10 min.
- Validar 1366×768, 1600×900, 1920×1080 e viewport efetivo da TV; conferir necessidade de rolagem lateral no piano em áreas menores.
- Verificar reentrada por navegação/hash, troca de tema, modo silencioso, cancelamento e offline depois da atualização do SW.
- Conferir a governança por módulo no banco antes de ativar controle remoto específico de Piano.
- Sem modelos 3D novos; sem áudio comercial, login, notas ou dados pessoais.
- Esta PR é um piloto: NÃO publicar em gh-pages sem teste de interface real.

## Como executar
\`node --test tests/piano-touch.test.cjs\`

Sem dependências de NPM.

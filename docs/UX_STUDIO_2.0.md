# TV TOUCH / Design System e Fluxos — Studio 2.0

## Premissa física

Samsung WA86F, 86 polegadas, Android 14, orientação horizontal 16:9; navegação direta por dedo e caneta. Não assumir acesso ao firmware ou ao número exato de toques entregue pelo navegador. Considerar usuários em pé, a um braço da tela, usando a faixa inferior para navegar e áreas centrais para interagir.

## Fluxos

1. Tela inicial → escolher uma das experiências grandes → interagir → Voltar, sem login.
2. Alternativa: navegação inferior → Laboratório/Biblioteca/Favoritos/Guia/Diagnóstico.
3. Seleção de disciplina opcional e não bloqueante. Telemetria somente com autorização.
4. Administração abre separadamente e exige autenticação/controle por Supabase quando configurado.

## Tokens e tipografia

- Black: superfície #060811; destaque #B9FF5B; ações #00E4EF; visualização espacial #7C5AFF; áreas imersivas em gradientes escuros saturados.
- Claro: base #F4F5FC, contraste #10162B e mesmas experiências coloridas como módulos.
- Vivo: fundo com matizes e intensidade variáveis, nunca piscando; botão Pausar e preferência de redução de movimento.
- Títulos curtos e fortes; rótulos funcionais; ícones SVG vetoriais próprios; evitar emojis como arte de interface.
- Toque primário: alvo mínimo pretendido ~56px CSS, adaptativo a dimensões de viewport; não confundir 86" físicos com resolução CSS do navegador.

## Perfis de desempenho

- WebGL 3D renderiza sob demanda, com resolução interna limitada em navegadores de alta densidade.
- Física em Canvas 2D pausa fora da página; no máximo 26 corpos.
- Efeitos CSS são interrompidos com `prefers-reduced-motion` quando possível.
- Sem dependências CDN obrigatórias. Three.js e GSAP são opções futuras caso agreguem valor e sejam empacotados localmente; não introduzir dependência de internet nas aulas locais.

## Backlog de experiências

P0: jogo da memória, universo 3D, física 2D, quadro, sólidos, encaixe, porto — implementados na interface local.
P1: circuitos elétricos arrastáveis, engrenagens 2D, quebra-cabeças por disciplina, biblioteca de modelos glTF licenciados.
P2: linha do tempo histórica 3D, mapas de Paranaguá com camadas (OpenStreetMap sujeito à rede), modelos de terminal portuário, competições cooperativas multitoque.
P3: biblioteca autoral por disciplina, publicação de atividades por administradores, relatórios de uso agregados por equipamento.

## Critérios de aceite

- 1366×768, 1600×900, 1920×1080, 3840×2160: sem overflow horizontal na home e experiências críticas.
- Ao entrar numa experiência, scripts pesados só desenham enquanto a tela está ativa.
- Navegação, seleção de tema, voltar, memória e física funcionam sem login nem backend.
- Modo sem WebGL mostra alternativa 2D explicitamente identificada.
- Homologação em tela física: testar toque, pinça, caneta, fluidez e opções de modo tela cheia.
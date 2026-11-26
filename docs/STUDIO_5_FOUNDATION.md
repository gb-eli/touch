# AGV TOUCH 5.0 — fundação Alpha 1

Base: 9fda57ce924fff27e598cf1c3dcfb4d2cedf8a1a. Auditoria Gemini 26/11/2026, 25 funcionalidades, 15 itens de backlog. Fontes: https://drive.google.com/drive/folders/1B75ZD2aQzLD7ksAcyGfooI8QHkXq-XcG e https://docs.google.com/spreadsheets/d/1KlL8AkHnRaGnp3WBF4tUNiTDNPduEZ9E5IrrlzVVKqg/edit.

## Escopo real
Novo ponto de entrada em public/studio5/index.html, separado do legado. Um CSS, um JS, sem splash ou canvas decorativo. Shell com navegação inferior, tema claro/escuro, alternância de apresentação, fullscreen, catálogo com 20 entradas, pêndulo nativo SVG com integração semi-implícita e fórmula de período aproximado. Sem CDN. Preferências locais com chaves próprias. Os motores legados não são reescritos nesta etapa: links usam rotas verificadas; sair para essas páginas ainda carrega suas interfaces originais. Modo apresentação aplica-se apenas ao shell e pêndulo. Diagnóstico e guia acessíveis via Configurações. Não há novo service worker: offline e isolamento de caches não homologados. Não remover nem substituir arquivos antigos.

## Critérios da fase 1
- 1280x720 DPR3 e 1280x630 DPR3: home sem overflow, dock inferior, principais alvos >=56 CSS px, nenhuma sobreposição.
- 1024x600 e 844x390: preservar acesso a todos os destinos; 390x844: rolagem interna permitida.
- Navegação, foco, temas e fullscreen reais; preferências persistem no navegador.
- Cada experiência nativa: palco alvo >=75% após recolher controles, medir DOM; não declarar meta cumprida sem browser.
- Não confundir dados reportados do Gemini com nova medição; repetir 3 cargas frias/quentes para performance.
- Teste físico WA86F: alcance, reflexo, leitura e multitoque.

## Backlog e status
B-05/B-06/B-10/B-13/B-15: tratados na nova home por arquitetura limpa; pendente homologação e migração de todos os módulos.
B-01 Oficina, B-02 Aventuras 3D, B-03 Sólidos: pendentes; preservar motor e dados até migração validada.
B-04 módulos nativos: pêndulo é primeiro exemplo funcional; as cinco disciplinas ausentes continuam pendentes.
B-07 Arcade, B-08 vídeo, B-09 Tech News, B-12 Aventuras, B-14 Damas: pendentes; não alterados.
B-11: não promover preview4.
Divergências de auditoria: PDF p.37 indica 21/26 CSS com reduced-motion; overflow da preview é vertical conforme PDF p.38; tempos de carga repetidos devem ser reconferidos. Fases 2–4 e chefe de Aventuras não homologados. Tema claro existe na home antiga mas não unificado.

## Próximos passos
Integrar Oficina em shell sem sacrificar palco; refatorar ciclo de vida de módulos e controles; renderer WebGL compatível com hardware; novos labs disciplinares. Teste físico antes de release. Não abrir PR até reunir primeira entrega funcional e validar em navegador.

Revisão Alpha 1: o comprimento do fio acompanha o valor físico proporcionalmente, arco e referência acompanham a amplitude, medições estáticas não são reescritas a cada quadro, link de salto não muda a rota. No modo apresentação o palco ocupa o espaço de conteúdo e os parâmetros ficam ocultos. Medição real de bounding boxes e revisão de sobreposição ainda pendentes.

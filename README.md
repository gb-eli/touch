# TV TOUCH — AGV

Portal educacional interativo para três painéis Android Smart Touch de 86" do Colégio Estadual Alberto Gomes Veiga, Paranaguá/PR.

## Objetivo

Experiências pedagógicas prontas para uso por toque, incluindo desenho, geometria 3D, encaixe de formas, vídeos 360° e links curados para ferramentas externas.

## Arquitetura da versão 1.3

- **Frontend:** HTML, CSS e JavaScript puros, aptos à hospedagem estática.
- **Experiência docente:** acesso sem login; seleção de área curricular, disciplina e TV TOUCH 01/02/03.
- **Diagnóstico:** capacidades de navegador, multitoque, FPS e latência HTTP (não ping ICMP).
- **Telemetria opcional:** Edge Function Supabase; sem identificação pessoal de alunos.
- **Gestão:** dashboard administrativo com autenticação Supabase Auth, RLS e relatórios agregados.

## Status deste repositório

**Preparação inicial.** O pacote completo v1.3 foi gerado fora do GitHub e **ainda precisa ser enviado à raiz do repositório**. Esta branch contém somente a documentação de implantação, não uma versão executável do portal. Não considerar a aplicação publicada nem o banco provisionado.

Arquivos esperados ao importar a versão 1.3:

```text
index.html
admin.html
app.js
admin.js
styles.css
admin.css
diagnostico.js
diagnostico.css
telemetria.js
telemetria.css
telemetria-config.js
service-worker.js
manifest.webmanifest
assets/
supabase/config.toml
supabase/functions/tv-touch-telemetry/index.ts
supabase/sql/01_setup.sql
supabase/sql/02_relatorios.sql
supabase/sql/03_admin_dashboard.sql
supabase/sql/04_validacao_admin.sql
```

## Publicação prevista

1. Importar **todo o conteúdo** do pacote v1.3 na raiz, mantendo as pastas.
2. Executar revisão de segurança e testes no navegador antes de integrar à `main`.
3. No projeto Supabase **dedicado**, executar os scripts de criação e administração, implantar a Edge Function e configurar os secrets no backend.
4. Preencher `telemetria-config.js` apenas com a URL e chave **publishable** do Supabase. **Nunca** publicar senhas, `service_role` ou `sb_secret_...`.
5. Provisionar conta administrativa no Supabase Auth e autorizá-la em `tvt_admins`.
6. Configurar e verificar GitHub Pages **de acordo com a visibilidade do repositório e o plano disponível**.
7. Homologar a experiência em cada TV real antes de liberar aos demais docentes.

## Privacidade

Não coletar nomes, senhas, IP/MAC brutos, geolocalização precisa, conteúdo desenhado ou respostas dos estudantes. O cadastro da sessão deve ser voluntário, orientado a equipamento e disciplina, e não deve impedir a realização da aula.

## Separação de sistemas

Este repositório é específico do **TV TOUCH** e deve manter backend independente do AGV+.

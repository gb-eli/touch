# 📺 TV TOUCH AGV — v1.4

Portal pedagógico interativo para três painéis Android de 86 polegadas do Colégio Estadual Alberto Gomes Veiga (Paranaguá/PR). HTML, CSS e JavaScript puro, com GitHub Pages e Supabase opcional.

## Áreas

- **Público**: `public/index.html` — biblioteca, vídeos 360°, atividades 2D/3D, desenho, encaixe, diagnósticos e escolha de disciplina sem login.
- **Admin**: `public/admin.html` — acesso com Supabase Auth + `tvt_admins`; métricas de uso, rede, FPS, testes de toque, ativar/desativar recursos e ajustar gestos por TV.

## Pastas

```
public/
  index.html             Portal público
  admin.html             Gestão protegida
  js/                    Experiências, diagnóstico, governança, telemetria, gestão
  css/                   Estilos da interface pública e administrativa
  assets/                Ícones
  service-worker.js      Cache offline do portal público
supabase/
  functions/             Edge Function de telemetria
  sql/                   Scripts 01–05 (incluindo governança)
docs/
  ARCHITECTURE.md        Fronteiras, segurança, dados e gestos
  DEPLOY.md              Implantação e checklist GO/NO-GO
.github/workflows/
  pages.yml              GitHub Actions publica `public/` da main
```

Não há configuração Supabase ativa por padrão. Ferramentas locais funcionam sem backend; o painel de gestão real exige banco, políticas e conta administrativa.

Veja [arquitetura](docs/ARCHITECTURE.md) e [implantação](docs/DEPLOY.md).

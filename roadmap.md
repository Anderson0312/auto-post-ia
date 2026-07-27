# Roadmap — AutoPostIA / Plataforma de Vídeos Virais com IA

Documento vivo do projeto. Atualize este arquivo quando concluir entregas ou mudar prioridades.

**Última atualização:** junho de 2026

---

## Visão

Plataforma SaaS para criar conteúdo de vídeo curto com IA (TikTok, Reels, Shorts, etc.), com foco em viralização e objetivos de negócio (views, seguidores, vendas, leads, branding).

**Stack:** Next.js 15 (App Router) · Supabase Postgres · Redis/BullMQ · storage GCS ou local (`.storage/`)

**Decisão de arquitetura:** evoluir o monorepo Next.js (sem NestJS na Fase 1). Workers BullMQ em processo separado (`pnpm workers:dev`).

---

## Status geral

| Fase | Nome | Status |
|------|------|--------|
| **Fase 1** | Avatares + pipeline (roteiro → storyboard → cenas) | ✅ Concluída (vídeo pausado) |
| **Fase 2** | Viral Engine, assistente, TTS, legendas, música | 🟡 Quase concluída (falta música/ZIP) |
| **Fase 3** | Motion transfer, lip sync, publicação, calendário | ⬜ Planejada |
| **Fase 4** | Métricas, feedback loop, billing, observabilidade | ⬜ Planejada |

### Fluxo ativo hoje (sem vídeo)

```
Avatar → Projeto → Roteiro → Storyboard → Cenas (imagens)
```

Geração de **vídeo animado** está **pausada** até créditos Kling (pacote API) ou billing Gemini Veo.

---

## Fase 1 — Concluído ✅

### Banco de dados

- [x] `scripts/07-video-platform-schema.sql` — tabelas da plataforma de vídeo
- [x] `scripts/run-migrations.mjs` — controle via `schema_migrations` + backfill
- [x] Tabelas: `virtual_avatars`, `avatar_assets`, `content_projects`, `project_scripts`, `project_scenes`, `media_assets`, `generation_jobs`
- [x] Tabelas legadas mantidas: `posts`, `post_queue`, `social_accounts`, etc.

### Infraestrutura

- [x] Redis + BullMQ (`lib/queue/index.ts`) com fallback inline se Redis indisponível
- [x] Workers (`workers/index.ts`) — script, storyboard, vídeo, avatar
- [x] Storage GCS ou fallback local (`lib/storage/gcs-service.ts`, `/api/media/[...path]`)
- [x] Scripts: `pnpm db:migrate`, `pnpm workers:dev`

### Providers de IA

- [x] OpenAI — roteiro, storyboard, imagens (`gpt-image-1-mini`, edits com referência do avatar)
- [x] Gemini — Veo 3.1 (`lib/providers/gemini-provider.ts`)
- [x] Kling — image2video com JWT (`lib/providers/kling-auth.ts`)
- [x] Router (`lib/providers/provider-router.ts`)

### Avatares

- [x] Criar por descrição (fila `pipeline-avatar`)
- [x] Importar fotos de referência
- [x] `master_prompt`, galeria de assets, imagem principal
- [x] UI: `/dashboard/avatars`, `/new`, `/[id]`
- [x] APIs: `/api/avatars`, `/import`, `/[id]`
- [x] Consistência visual nas cenas via `images/edits` + imagem de referência do avatar

### Pipeline de conteúdo

- [x] Criar projeto (prompt, avatar, objetivo, plataforma, duração)
- [x] Gerar roteiro (`ScriptGenerator`)
- [x] Gerar storyboard (`StoryboardGenerator`)
- [x] Gerar imagens das cenas (`VideoPipelineService.generateSceneImages`)
- [x] UI: `/dashboard/projects`, `/new`, `/[id]` com stepper e progresso de jobs
- [x] APIs: `/api/projects`, `generate-script`, `generate-storyboard`, `generate-video`, `jobs`

### Testes autônomos (Fase 1)

| Comando | O que valida |
|---------|----------------|
| `pnpm test:pipeline` | Avatar → projeto → roteiro → storyboard |
| `pnpm test:image` | Geração de imagem OpenAI |
| `pnpm test:scene-avatar` | Cena com referência do avatar |
| `pnpm test:redis` | Conexão e enqueue BullMQ |
| `pnpm test:kling` | Auth JWT Kling + status do pacote API |
| `pnpm test:gemini` | Chave + billing Veo |
| `pnpm test:video` | Pipeline de vídeo (fallback se APIs pagas indisponíveis) |

### Base legada reaproveitada

- [x] Auth/sessão, registro, login
- [x] OAuth: Instagram, Facebook, LinkedIn, Twitter
- [x] Automação de posts texto+imagem (`dashboard/automation`)
- [x] Agendamento, relatórios, config IA

---

## Fase 1 — Vídeo (implementado, pausado) ⏸️

Código pronto; aguardando créditos externos.

- [x] `generate-video` + worker `pipeline-video`
- [x] Kling: JWT, base64 para imagens locais, modelo `kling-v2-6`
- [x] Gemini: Veo 3.1, image inline, download com API key
- [x] Fallback Kling → Gemini; fallback final = preview estático (imagem da cena)
- [x] UI: botão "Vídeo (em breve)" quando vídeo desabilitado
- [x] Flag: `NEXT_PUBLIC_VIDEO_GENERATION_ENABLED=true` + `VIDEO_GENERATION_ENABLED=true`

### Bloqueios conhecidos (vídeo)

| Provider | Situação | Ação necessária |
|----------|----------|-----------------|
| **Kling** | Auth OK, erro **1102** | Comprar **pacote de recursos da API** em [app.klingai.com/global/dev](https://app.klingai.com/global/dev) (créditos do app ≠ créditos API) |
| **Gemini Veo** | Chave OK, exige billing | Ativar billing em [aistudio.google.com](https://aistudio.google.com) → Billing |

Diagnóstico: `pnpm test:kling` · `pnpm test:gemini` · `GET /api/integrations/kling/status`

---

## Fase 2 — Em andamento 🟡

### Viral Engine + assistente guiado

- [x] `lib/viral-engine/viral-engine-service.ts`
- [x] Gerar ideias virais (hooks, CTAs, score 1–10)
- [x] Assistente guiado (briefing por perguntas)
- [x] Otimizar hook do roteiro
- [x] APIs: `POST /api/viral/ideas`, `/guided-brief`, `/optimize-hook`
- [x] UI em `/dashboard/projects/new` (painéis lateral)
- [x] UI em `/dashboard/projects/[id]` (botão "Otimizar hook")
- [x] Teste: `pnpm test:viral`

### Concluído na Fase 2 (continuação)

- [x] **Modo tendências** — `ViralEngineService.getTrendingTopics`, `POST /api/viral/trends`, `TrendsPanel`
- [x] **TTS / narração** — `NarrationService` (OpenAI `tts-1`), `POST /api/projects/[id]/generate-narration`
- [x] **Legendas automáticas** — `SubtitlesService` + SRT/VTT, `POST /api/projects/[id]/generate-subtitles`
- [x] Integrar Viral Engine no `ScriptGenerator` (`buildScriptContext` + `viralContext` no roteiro)
- [x] Polling automático de jobs na UI (`useProjectAutoRefresh`)
- [x] Exportar pacote do projeto — `GET /api/projects/[id]/export` (JSON com roteiro, cenas, áudio, legendas)
- [x] UI pós-produção em `/dashboard/projects/[id]` (`ProjectPostProduction`)
- [x] Teste: `pnpm test:subtitles`

### Pendente na Fase 2

- [ ] **Música de fundo** — biblioteca ou geração (opcional)
- [ ] Export ZIP com arquivos binários (hoje exporta JSON + links para SRT/MP3)

---

## Fase 3 — Planejada ⬜

- [ ] Motion Transfer (Kling)
- [ ] Lip sync
- [ ] Publicação Reels / Shorts / TikTok (reaproveitar OAuth)
- [ ] Calendário editorial
- [ ] Agendamento de publicação de projetos de vídeo
- [ ] Publicar carrossel de cenas enquanto vídeo não estiver ativo

---

## Fase 4 — Planejada ⬜

- [ ] Métricas reais das redes (views, engajamento)
- [ ] Feedback loop — otimizar prompts com base em performance
- [ ] Stripe / planos e limites por uso
- [ ] PostHog / Sentry
- [ ] Limites em `usage_tracking` por plano

---

## Débitos técnicos / melhorias

- [ ] Warning build: `sendPasswordResetEmail` em `forgot-password/route.ts`
- [ ] `lib/scheduler.ts` legado pode rodar no build — separar do pipeline BullMQ
- [ ] GCS: configurar `GCS_PROJECT_ID`, `GCS_CLIENT_EMAIL`, `GCS_PRIVATE_KEY` em produção
- [ ] Página `forgot-password` alinhada com `email-service`
- [ ] Remover ou documentar tabelas legadas quando migração completa

---

## Variáveis de ambiente (referência)

### Obrigatórias (core)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
POSTGRES_URL_NON_POOLING=
OPENAI_API_KEY=
JWT_SECRET=
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Pipeline / workers

```env
REDIS_URL=
OPENAI_IMAGE_MODEL=gpt-image-1-mini
```

### Vídeo (quando reativar)

```env
VIDEO_GENERATION_ENABLED=true
NEXT_PUBLIC_VIDEO_GENERATION_ENABLED=true
VIDEO_PROVIDER=gemini          # ou omitir para Kling primeiro
KLING_ACCESS_KEY=              # ou Access_Key_kling_ai
KLING_SECRET_KEY=              # ou Secret_Key_kling_ai
KLING_VIDEO_MODEL=kling-v2-6
GEMINI_API_KEY=                # ou gemini_api_key
GEMINI_VIDEO_MODEL=veo-3.1-fast-generate-preview
```

### Storage produção (opcional)

```env
GCS_BUCKET=
GCS_PROJECT_ID=
GCS_CLIENT_EMAIL=
GCS_PRIVATE_KEY=
```

---

## Como rodar localmente

```bash
pnpm install
pnpm db:migrate          # migrações SQL
pnpm dev                 # app (terminal 1)
pnpm workers:dev         # workers BullMQ (terminal 2)
```

Testes rápidos:

```bash
pnpm test:pipeline
pnpm test:viral
```

---

## Ordem sugerida de trabalho

1. **Agora (sem vídeo):** completar Fase 2 — tendências → TTS → legendas
2. **Quando tiver créditos:** reativar vídeo (`VIDEO_GENERATION_ENABLED`) e validar E2E
3. **Depois:** Fase 3 publicação + calendário
4. **Por último:** Fase 4 monetização e métricas

---

## Critérios de aceite por fase

### Fase 1 (atual, sem vídeo)

- [x] Usuário cria avatar (texto ou importação)
- [x] Usuário cria projeto e gera roteiro + storyboard + cenas
- [x] Avatar mantém aparência nas cenas (referência visual)
- [x] Jobs assíncronos com Redis + estado em Postgres
- [ ] Vídeo animado E2E *(adiado)*

### Fase 2

- [x] Gerar ideias virais e briefing guiado
- [x] Otimizar hook de roteiro existente
- [ ] Narração + legendas exportáveis
- [ ] Modo tendências funcional

### Fase 3

- [ ] Publicar conteúdo em pelo menos uma rede (ex.: Instagram)
- [ ] Agendar publicação

### Fase 4

- [ ] Dashboard de métricas pós-publicação
- [ ] Planos pagos com limites de geração

---

## Estrutura de pastas (referência rápida)

```
app/
  api/avatars, projects, viral, media, integrations/
  dashboard/avatars, projects, automation, social-accounts/
lib/
  avatars/          # AvatarService
  pipeline/         # script, storyboard, video
  providers/        # OpenAI, Gemini, Kling
  viral-engine/     # Fase 2
  queue/            # BullMQ
  storage/          # GCS + local
workers/index.ts
scripts/            # SQL + testes
```

---

## Notas de decisão

| Data | Decisão |
|------|---------|
| 2026 | MVP no Next.js modular, sem NestJS |
| 2026 | Fase 1 = avatares + pipeline até cenas |
| 2026 | DALL-E 3 → `gpt-image-1-mini` |
| 2026 | Vídeo pausado; foco em conteúdo estático + Viral Engine |
| 2026 | Créditos Kling app ≠ pacote API (erro 1102) |
| 2026 | Testes autônomos antes de pedir validação manual ao usuário |

---

*Mantenha este arquivo atualizado ao fechar cada entrega.*

# AutoPostIA requirements

## Integração LinkedIn (OAuth)

Para conectar contas do LinkedIn na página `dashboard/social-accounts`, configure um app no LinkedIn e as variáveis de ambiente conforme abaixo.

### Passos no LinkedIn Developers

- Crie uma aplicação em https://www.linkedin.com/developers/
- Configure os escopos: `r_liteprofile`, `r_emailaddress`, `w_member_social`
- Adicione o Redirect URL: `http://localhost:3000/api/auth/linkedin/callback` (ajuste para produção)

### Produtos e escopos

O LinkedIn possui dois produtos para autenticação/autorização que liberam escopos diferentes. É importante alinhar os escopos usados no app com os produtos habilitados na sua aplicação:

- **Share on LinkedIn (Compartilhe no LinkedIn)**
  - Libera o escopo: `w_member_social` (necessário para publicar posts via API `ugcPosts`).
- **Sign In with LinkedIn (OAuth clássico)**
  - Libera: `r_liteprofile` e (mediante aprovação) `r_emailaddress`.
- **Sign In with LinkedIn usando OpenID Connect (OIDC)**
  - Libera escopos OIDC: `openid profile email`.
  - Se usar OIDC, não use `r_liteprofile`/`r_emailaddress`; utilize `openid profile email`.

Nosso endpoint de autorização aceita escopos via variável `LINKEDIN_SCOPES`. Exemplos:

- Com OAuth clássico: `LINKEDIN_SCOPES=r_liteprofile r_emailaddress w_member_social`
- Com OIDC: `LINKEDIN_SCOPES=openid profile email` (adicione `w_member_social` se também for publicar)

Observação: o fluxo atual de callback busca o perfil com `GET /v2/me` (requer `r_liteprofile`) e o e-mail com `GET /v2/emailAddress` (requer `r_emailaddress`). Se você optar por OIDC, a informação de perfil/e-mail pode vir no `id_token` (escopos `profile`/`email`) — neste caso ajuste os escopos e considere personalizar o callback para ler o `id_token`.

### Variáveis de ambiente

Adicione no `.env.local`:

```
LINKEDIN_CLIENT_ID=seu_client_id
LINKEDIN_CLIENT_SECRET=seu_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback
JWT_SECRET=uma_chave_secreta_segura
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
LINKEDIN_SCOPES=r_liteprofile w_member_social
```

### Fluxo de conexão

- Na página de contas sociais, ao clicar em "Conectar" para uma plataforma, o app redireciona para `/api/auth/{plataforma}` usando a sessão via cookie HttpOnly.
- Para LinkedIn, o endpoint `/api/auth/linkedin` redireciona ao consentimento (OAuth) com `state` usado apenas para proteção CSRF; a identificação do usuário é feita no callback pela sessão (cookie).
- O callback `/api/auth/linkedin/callback` troca o `code` por `access_token`, busca o perfil e salva/upserta a conta no banco.
- Após sucesso, o usuário é redirecionado de volta à página `dashboard/social-accounts` com `?status=success&platform=linkedin`.

Observação: esteja autenticado via sessão (cookie HttpOnly). Não usamos localStorage nem cabeçalho Authorization/Bearer para identificar o usuário no fluxo de conexão.

> **Roadmap completo (feito + pendente):** veja [`roadmap.md`](roadmap.md)

## Plataforma de Vídeos (Fase 1)

### Migrações

```bash
pnpm db:migrate
```

### Workers (requer Redis)

```bash
pnpm workers:dev
```

### Variáveis adicionais

```
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=...
KLING_ACCESS_KEY=...
KLING_SECRET_KEY=...
GCS_BUCKET=...
GCS_PROJECT_ID=...
GCS_CLIENT_EMAIL=...
GCS_PRIVATE_KEY=...
```

Sem Redis configurado, arquivos são salvos em `.storage/` e servidos via `/api/media/...`.
Sem Redis, jobs do pipeline rodam inline na API.

### Modelo de imagem OpenAI

DALL-E 3 foi descontinuado. Use:

```
OPENAI_IMAGE_MODEL=gpt-image-1-mini
```

Opcional: `gpt-image-1` ou `gpt-image-2` para maior qualidade.

### Vídeo com Gemini Veo (alternativa ao Kling)

1. Crie/ative billing em [Google AI Studio](https://aistudio.google.com) → **Billing** (tier pago; pode exigir prepay mínimo de ~US$10).
2. Gere uma API key em [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
3. Configure no `.env.local`:

```
GEMINI_API_KEY=sua_chave_aqui
GEMINI_VIDEO_MODEL=veo-3.1-fast-generate-preview
VIDEO_PROVIDER=gemini
```

`veo-3.1-fast-generate-preview` é mais barato; use `veo-3.1-generate-preview` para maior qualidade.

Teste: `pnpm test:gemini`

Enquanto o Kling não tiver pacote de API ativo, `VIDEO_PROVIDER=gemini` faz o pipeline usar só o Gemini.

### Fase 2 — Viral Engine (em andamento)

Fluxo atual **sem vídeo**: avatar → roteiro → storyboard → **cenas (imagens)**.

Recursos disponíveis:
- **Assistente guiado** — briefing em `/dashboard/projects/new`
- **Gerador de ideias virais** — hooks, CTAs e score de viralidade
- **Otimizar hook** — no detalhe do projeto, após gerar roteiro

Geração de vídeo pausada por padrão. Para reativar:

```
NEXT_PUBLIC_VIDEO_GENERATION_ENABLED=true
VIDEO_GENERATION_ENABLED=true
```

Teste: `pnpm test:viral`

**Próximos na Fase 2:** modo tendências, TTS/narração, legendas automáticas, música de fundo.

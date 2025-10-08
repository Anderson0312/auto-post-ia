# AutoPostIA requirements

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/anderson0312s-projects/v0-auto-post-ia-requirements)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/TEXpoi5Ob7j)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/anderson0312s-projects/v0-auto-post-ia-requirements](https://vercel.com/anderson0312s-projects/v0-auto-post-ia-requirements)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/TEXpoi5Ob7j](https://v0.dev/chat/projects/TEXpoi5Ob7j)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

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
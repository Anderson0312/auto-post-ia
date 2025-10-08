export async function GET(req: Request) {
  const url = new URL(req.url)
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return new Response(JSON.stringify({ error: "Configuração do LinkedIn ausente" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Allow configuring scopes via env. Default to minimal scope to avoid unauthorized errors.
  const rawScopes = process.env.LINKEDIN_SCOPES?.trim() || "r_liteprofile"
  const scope = encodeURIComponent(rawScopes.replace(/\s+/g, " "))
  // Usamos estado apenas como proteção CSRF; não carrega token do usuário.
  const state = "session"

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`

  return Response.redirect(authUrl)
}
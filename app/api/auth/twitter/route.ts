export async function GET(req: Request) {
  const url = new URL(req.url)
  const clientId = process.env.TWITTER_CLIENT_ID
  const redirectUri = process.env.TWITTER_REDIRECT_URI
  const rawScopes = (process.env.TWITTER_SCOPES || "tweet.read users.read offline.access").trim()

  if (!clientId || !redirectUri) {
    return new Response(JSON.stringify({ error: "Configuração do Twitter ausente" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  // PKCE é necessário no OAuth 2.0 do Twitter
  const makeBase64Url = (buf: Buffer) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  const { randomBytes, createHash } = await import("crypto")
  const verifier = makeBase64Url(randomBytes(32))
  const challenge = makeBase64Url(createHash("sha256").update(verifier).digest())

  // Codificar state apenas com code_verifier (token removido)
  const statePayload = { cv: verifier }
  const state = encodeURIComponent(Buffer.from(JSON.stringify(statePayload)).toString("base64url"))
  const scope = encodeURIComponent(rawScopes.replace(/\s+/g, " "))

  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}&scope=${scope}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`

  return Response.redirect(authUrl)
}
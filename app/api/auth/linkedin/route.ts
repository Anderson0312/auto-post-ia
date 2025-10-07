export async function GET(req: Request) {
  const url = new URL(req.url)
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI
  const token = url.searchParams.get("token") || ""

  if (!clientId || !redirectUri) {
    return new Response(JSON.stringify({ error: "Configuração do LinkedIn ausente" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const scope = encodeURIComponent("r_liteprofile r_emailaddress w_member_social")
  const state = encodeURIComponent(token)

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`

  return Response.redirect(authUrl)
}
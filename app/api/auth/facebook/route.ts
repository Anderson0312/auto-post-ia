export async function GET(req: Request) {
  const clientId = process.env.FACEBOOK_CLIENT_ID
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI
  const rawScopes = (process.env.FACEBOOK_SCOPES || "public_profile email").trim()
  const scope = encodeURIComponent(rawScopes.replace(/\s+/g, " "))
  const state = "session"

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri || "",
  )}&state=${state}&scope=${scope}`
  return Response.redirect(authUrl)
}
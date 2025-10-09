export async function GET(req: Request) {
  const clientId = process.env.INSTAGRAM_CLIENT_ID
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI
  const scope = encodeURIComponent("user_profile,user_media")
  const state = "session"
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri || "",
  )}&scope=${scope}&response_type=code&state=${state}`
  return Response.redirect(authUrl)
}

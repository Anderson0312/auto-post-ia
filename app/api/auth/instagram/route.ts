export async function GET(req: Request) {
  const clientId = process.env.INSTAGRAM_CLIENT_ID
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code`
  return Response.redirect(authUrl)
}

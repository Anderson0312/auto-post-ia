import { type NextRequest, NextResponse } from "next/server"
import { createPkce, encodeOAuthState } from "@/lib/oauth/helpers"

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID
  const redirectUri =
    process.env.YOUTUBE_REDIRECT_URI || `${new URL(req.url).origin}/api/auth/youtube/callback`
  const scopes = (
    process.env.YOUTUBE_SCOPES ||
    "openid email profile https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube"
  ).trim()

  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID não configurada. Crie o OAuth em console.cloud.google.com" },
      { status: 500 },
    )
  }

  const intent = new URL(req.url).searchParams.get("intent") || "connect"
  const { verifier, challenge } = createPkce()
  const state = encodeOAuthState({ cv: verifier, intent })

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", scopes)
  authUrl.searchParams.set("access_type", "offline")
  authUrl.searchParams.set("prompt", "consent")
  authUrl.searchParams.set("include_granted_scopes", "true")
  authUrl.searchParams.set("state", state)
  authUrl.searchParams.set("code_challenge", challenge)
  authUrl.searchParams.set("code_challenge_method", "S256")

  return NextResponse.redirect(authUrl.toString())
}

import { type NextRequest, NextResponse } from "next/server"
import { createPkce, encodeOAuthState } from "@/lib/oauth/helpers"

export async function GET(req: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const redirectUri =
    process.env.TIKTOK_REDIRECT_URI || `${new URL(req.url).origin}/api/auth/tiktok/callback`
  const scopes =
    process.env.TIKTOK_SCOPES ||
    "user.info.basic,user.info.profile,user.info.stats,video.upload,video.publish"

  if (!clientKey) {
    return NextResponse.json(
      { error: "TIKTOK_CLIENT_KEY não configurada. Crie o app em developers.tiktok.com" },
      { status: 500 },
    )
  }

  const intent = new URL(req.url).searchParams.get("intent") || "connect"
  const { verifier, challenge } = createPkce()
  const state = encodeOAuthState({ cv: verifier, intent })

  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/")
  authUrl.searchParams.set("client_key", clientKey)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", scopes)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("state", state)
  authUrl.searchParams.set("code_challenge", challenge)
  authUrl.searchParams.set("code_challenge_method", "S256")

  return NextResponse.redirect(authUrl.toString())
}

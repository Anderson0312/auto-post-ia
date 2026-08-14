import { type NextRequest } from "next/server"
import {
  decodeOAuthState,
  finishOAuth,
  oauthRedirect,
  resolveOAuthUser,
  upsertSocialAccount,
} from "@/lib/oauth/helpers"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const oauthError = url.searchParams.get("error")
    const state = decodeOAuthState(url.searchParams.get("state"))

    if (oauthError) {
      return oauthRedirect(
        req,
        `/dashboard/social-accounts?status=error&reason=${encodeURIComponent(oauthError)}`,
      )
    }
    if (!code) {
      return oauthRedirect(req, "/dashboard/social-accounts?status=error&reason=missing_code")
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET
    const redirectUri =
      process.env.TIKTOK_REDIRECT_URI || `${url.origin}/api/auth/tiktok/callback`

    if (!clientKey || !clientSecret) {
      return oauthRedirect(req, "/dashboard/social-accounts?status=error&reason=misconfigured")
    }

    const body = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    })
    if (state?.cv) body.set("code_verifier", state.cv)

    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
    const tokenJson = await tokenRes.json()
    const accessToken = tokenJson.access_token as string | undefined
    const openId = String(tokenJson.open_id || "")

    if (!tokenRes.ok || !accessToken || !openId) {
      console.error("TikTok token exchange failed:", tokenJson)
      return oauthRedirect(req, "/dashboard/social-accounts?status=error&reason=token_exchange_failed")
    }

    let username = openId
    let displayName = "TikTok"
    let avatarUrl: string | undefined
    let followers = 0

    const meRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name,username,follower_count",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    if (meRes.ok) {
      const me = await meRes.json()
      const user = me?.data?.user || {}
      username = String(user.username || user.open_id || openId)
      displayName = String(user.display_name || username)
      avatarUrl = user.avatar_url
      followers = Number(user.follower_count || 0)
    }

    const { userId, createdSession } = await resolveOAuthUser({
      req,
      platform: "tiktok",
      platformUserId: openId,
      name: displayName,
    })

    const expiresIn = Number(tokenJson.expires_in || 0)
    await upsertSocialAccount({
      userId,
      platform: "tiktok",
      platformUserId: openId,
      username,
      displayName,
      accessToken,
      refreshToken: tokenJson.refresh_token,
      tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      followersCount: followers,
      avatarUrl,
    })

    return finishOAuth(req, userId, createdSession || state?.intent === "login", "tiktok")
  } catch (error) {
    console.error("TikTok callback error:", error)
    return oauthRedirect(req, "/dashboard/social-accounts?status=error&reason=unknown")
  }
}

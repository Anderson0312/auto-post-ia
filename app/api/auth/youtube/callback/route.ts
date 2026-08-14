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

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET
    const redirectUri =
      process.env.YOUTUBE_REDIRECT_URI || `${url.origin}/api/auth/youtube/callback`

    if (!clientId || !clientSecret) {
      return oauthRedirect(req, "/dashboard/social-accounts?status=error&reason=misconfigured")
    }

    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    })
    if (state?.cv) tokenBody.set("code_verifier", state.cv)

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    })
    const tokenJson = await tokenRes.json()
    const accessToken = tokenJson.access_token as string | undefined

    if (!tokenRes.ok || !accessToken) {
      console.error("YouTube token exchange failed:", tokenJson)
      return oauthRedirect(req, "/dashboard/social-accounts?status=error&reason=token_exchange_failed")
    }

    let email: string | undefined
    let name = "YouTube"
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (userInfoRes.ok) {
      const info = await userInfoRes.json()
      email = info.email
      name = info.name || info.email || name
    }

    let platformUserId = ""
    let username = name
    let displayName = name
    let followers = 0
    let avatarUrl: string | undefined

    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    if (channelRes.ok) {
      const channels = await channelRes.json()
      const channel = channels?.items?.[0]
      if (channel) {
        platformUserId = String(channel.id)
        username = channel.snippet?.customUrl || channel.snippet?.title || platformUserId
        displayName = channel.snippet?.title || displayName
        avatarUrl = channel.snippet?.thumbnails?.default?.url
        followers = Number(channel.statistics?.subscriberCount || 0)
      }
    }

    if (!platformUserId) {
      platformUserId = String(email || "")
    }

    if (!platformUserId) {
      return oauthRedirect(req, "/dashboard/social-accounts?status=error&reason=userinfo_failed")
    }

    const { userId, createdSession } = await resolveOAuthUser({
      req,
      platform: "youtube",
      platformUserId,
      email,
      name: displayName,
    })

    const expiresIn = Number(tokenJson.expires_in || 0)
    await upsertSocialAccount({
      userId,
      platform: "youtube",
      platformUserId,
      username,
      displayName,
      accessToken,
      refreshToken: tokenJson.refresh_token,
      tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      followersCount: followers,
      avatarUrl,
    })

    return finishOAuth(req, userId, createdSession || state?.intent === "login", "youtube")
  } catch (error) {
    console.error("YouTube callback error:", error)
    return oauthRedirect(req, "/dashboard/social-accounts?status=error&reason=unknown")
  }
}

import { NextResponse, type NextRequest } from "next/server"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const oauthError = url.searchParams.get("error")

    const makeRedirect = (path: string) => {
      const origin = (() => {
        try {
          return new URL(req.url).origin
        } catch {
          return "http://localhost:3000"
        }
      })()
      const target = new URL(path, origin)
      return NextResponse.redirect(target.toString())
    }

    if (oauthError) {
      const desc = url.searchParams.get("error_description") || oauthError
      const reason = encodeURIComponent(oauthError)
      const details = encodeURIComponent(desc)
      return makeRedirect(`/dashboard/social-accounts?status=error&reason=${reason}&details=${details}`)
    }

    if (!code) {
      return makeRedirect("/dashboard/social-accounts?status=error&reason=missing_code")
    }

    // Identificar usuário via cookie de sessão
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return makeRedirect("/dashboard/social-accounts?status=error&reason=unauthorized")
    }

    const clientId = process.env.FACEBOOK_CLIENT_ID
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return makeRedirect("/dashboard/social-accounts?status=error&reason=misconfigured")
    }

    // Trocar code por access token (Facebook)
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&client_secret=${encodeURIComponent(clientSecret)}&code=${encodeURIComponent(code)}`,
    )
    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error("Facebook token exchange failed:", errText)
      return makeRedirect("/dashboard/social-accounts?status=error&reason=token_exchange_failed")
    }

    const tokenJson = await tokenRes.json()
    let accessToken: string = tokenJson.access_token
    let expiresIn: number | null = tokenJson.expires_in ? Number(tokenJson.expires_in) : null

    // Optional: tentar converter para long-lived token
    try {
      const longRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
          clientId,
        )}&client_secret=${encodeURIComponent(clientSecret)}&fb_exchange_token=${encodeURIComponent(accessToken)}`,
      )
      if (longRes.ok) {
        const longJson = await longRes.json()
        accessToken = longJson.access_token || accessToken
        expiresIn = longJson.expires_in ? Number(longJson.expires_in) : expiresIn
      }
    } catch (err) {
      // ignore
    }

    // Buscar perfil
    let platformUserId = ""
    let username = ""
    let displayName = ""
    const meRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`,
    )
    if (meRes.ok) {
      const me = await meRes.json()
      platformUserId = String(me.id || "")
      displayName = String(me.name || platformUserId)
      username = String(me.email || displayName)
    } else {
      const errText = await meRes.text()
      console.error("Facebook userinfo failed:", errText)
      return makeRedirect("/dashboard/social-accounts?status=error&reason=userinfo_failed")
    }

    const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null

    // Upsert conta social
    let existing: any = null
    try {
      existing = await DatabaseService.getSocialAccount(userId, "facebook", platformUserId)
    } catch (err) {
      // ignore
    }

    if (existing) {
      await DatabaseService.updateSocialAccount(existing.id, {
        username,
        display_name: displayName,
        access_token: accessToken,
        token_expires_at: tokenExpiresAt,
        is_connected: true,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
    } else {
      await DatabaseService.createSocialAccount({
        user_id: userId,
        platform: "facebook",
        platform_user_id: platformUserId,
        username,
        display_name: displayName,
        access_token: accessToken,
        token_expires_at: tokenExpiresAt,
      })
    }

    return makeRedirect("/dashboard/social-accounts?status=success&platform=facebook")
  } catch (error) {
    console.error("Facebook callback error:", error)
    const origin = (() => {
      try {
        return new URL(req.url).origin
      } catch {
        return "http://localhost:3000"
      }
    })()
    const target = new URL("/dashboard/social-accounts?status=error&reason=unknown", origin)
    return NextResponse.redirect(target.toString())
  }
}
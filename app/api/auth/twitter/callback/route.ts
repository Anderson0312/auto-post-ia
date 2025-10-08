import { NextResponse, type NextRequest } from "next/server"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
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

    if (!code || !state) {
      return makeRedirect("/dashboard/social-accounts?status=error&reason=missing_code_or_state")
    }

    // Decodificar state (apenas code_verifier)
    let parsed: { cv: string } | null = null
    try {
      const json = Buffer.from(state, "base64url").toString("utf-8")
      const raw = JSON.parse(json)
      parsed = { cv: String(raw.cv || "") }
    } catch (err) {
      return makeRedirect("/dashboard/social-accounts?status=error&reason=invalid_state")
    }

    if (!parsed?.cv) {
      return makeRedirect("/dashboard/social-accounts?status=error&reason=incomplete_state")
    }

    // Identificar usuário pela sessão via cookie
    const userId = await getUserIdFromRequest(request as any)
    if (!userId) {
      return makeRedirect("/dashboard/social-accounts?status=error&reason=unauthorized")
    }

    const clientId = process.env.TWITTER_CLIENT_ID
    const clientSecret = process.env.TWITTER_CLIENT_SECRET
    const redirectUri = process.env.TWITTER_REDIRECT_URI

    if (!clientId || !redirectUri) {
      return makeRedirect("/dashboard/social-accounts?status=error&reason=misconfigured")
    }

    // Trocar code por access token
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: parsed.cv,
    })

    const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" }
    if (clientSecret) {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
      headers["Authorization"] = `Basic ${basic}`
    }

    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers,
      body,
    })
    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error("Twitter token exchange failed:", errText)
      return makeRedirect("/dashboard/social-accounts?status=error&reason=token_exchange_failed")
    }

    const tokenJson = await tokenRes.json()
    const accessToken = tokenJson.access_token as string
    const refreshToken = tokenJson.refresh_token as string | undefined
    const expiresIn = Number(tokenJson.expires_in || 0)

    // Buscar perfil do usuário
    let platformUserId = ""
    let username = ""
    let displayName = ""
    try {
      const meRes = await fetch("https://api.twitter.com/2/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (meRes.ok) {
        const me = await meRes.json()
        platformUserId = me.data?.id || ""
        username = me.data?.username || platformUserId
        displayName = me.data?.name || username
      }
    } catch (err) {
      // silencioso
    }

    if (!platformUserId) {
      return makeRedirect("/dashboard/social-accounts?status=error&reason=userinfo_failed")
    }

    const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null

    // Upsert conta social
    let existing: any = null
    try {
      existing = await DatabaseService.getSocialAccount(userId, "twitter", platformUserId)
    } catch (err) {
      // ignore
    }

    if (existing) {
      await DatabaseService.updateSocialAccount(existing.id, {
        username,
        display_name: displayName,
        access_token: accessToken,
        refresh_token: refreshToken || existing.refresh_token,
        token_expires_at: tokenExpiresAt,
        is_connected: true,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
    } else {
      await DatabaseService.createSocialAccount({
        user_id: userId,
        platform: "twitter",
        platform_user_id: platformUserId,
        username,
        display_name: displayName,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
      })
    }

    return makeRedirect("/dashboard/social-accounts?status=success&platform=twitter")
  } catch (error) {
    console.error("Twitter callback error:", error)
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
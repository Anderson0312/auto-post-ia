import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const oauthError = url.searchParams.get("error")
    const state = url.searchParams.get("state") || ""

    const makeRedirect = (pathWithQuery: string) => {
      const target = new URL(pathWithQuery, url.origin)
      return Response.redirect(target.toString())
    }

    // Handle OAuth errors returned by LinkedIn
    if (oauthError) {
      const desc = url.searchParams.get("error_description") || oauthError
      const reason = encodeURIComponent(oauthError)
      const details = encodeURIComponent(desc)
      return makeRedirect(`/dashboard/social-accounts?status=error&reason=${reason}&details=${details}`)
    }

    if (!code) {
      return makeRedirect("/dashboard/social-accounts?status=error&reason=missing_code")
    }

    // Identificar usuário pela sessão (cookie HttpOnly)
    const userId = await getUserIdFromRequest(request as any)

    if (!userId) {
      return makeRedirect("/dashboard/social-accounts?status=error&reason=unauthorized")
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return makeRedirect("/dashboard/social-accounts?status=error&reason=misconfigured")
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text()
      console.error("LinkedIn token exchange failed:", errText)
      return makeRedirect("/dashboard/social-accounts?status=error&reason=token_exchange_failed")
    }

    const tokenData = await tokenResponse.json()
    const accessToken: string = tokenData.access_token
    const expiresIn: number = tokenData.expires_in

    // Determine if we should use OpenID Connect userinfo endpoint
    const rawScopes = (process.env.LINKEDIN_SCOPES || "").trim()
    const requestedScopes = rawScopes.split(/\s+/).filter(Boolean)
    const useOIDC = requestedScopes.includes("openid")

    let platformUserId = ""
    let displayName = ""
    let username = ""

    if (useOIDC) {
      // Use the OIDC-compliant userinfo endpoint when 'openid' scope is requested
      const userinfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!userinfoRes.ok) {
        const errText = await userinfoRes.text()
        console.error("LinkedIn userinfo fetch failed:", errText)
        return makeRedirect("/dashboard/social-accounts?status=error&reason=profile_failed")
      }
      const userinfo = await userinfoRes.json()
      platformUserId = userinfo.sub
      displayName = (userinfo.name || `${userinfo.given_name || ""} ${userinfo.family_name || ""}`.trim()).trim()
      username = userinfo.email || platformUserId
    } else {
      // Fallback to classic profile endpoints (require r_liteprofile / r_emailaddress)
      const apiVersion = process.env.LINKEDIN_API_VERSION || "202405"
      const commonHeaders = {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": apiVersion,
      }

      // Fetch profile info
      const profileRes = await fetch("https://api.linkedin.com/v2/me", {
        headers: commonHeaders,
      })

      if (!profileRes.ok) {
        const errText = await profileRes.text()
        console.error("LinkedIn profile fetch failed:", errText)
        return makeRedirect("/dashboard/social-accounts?status=error&reason=profile_failed")
      }

      const profile = await profileRes.json()
      platformUserId = profile.id
      const firstName = profile.localizedFirstName || ""
      const lastName = profile.localizedLastName || ""

      // Fetch email (optional)
      username = platformUserId
      try {
        const emailRes = await fetch(
          "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
          { headers: commonHeaders },
        )
        if (emailRes.ok) {
          const emailData = await emailRes.json()
          const elements = emailData.elements || []
          const email = elements[0]?.["handle~"]?.emailAddress
          if (email) username = email
        }
      } catch (err) {
        console.warn("LinkedIn email fetch failed:", err)
      }

      displayName = `${firstName} ${lastName}`.trim()
    }

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Upsert social account
    let existing = null
    try {
      existing = await DatabaseService.getSocialAccount(userId, "linkedin", platformUserId)
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
        platform: "linkedin",
        platform_user_id: platformUserId,
        username,
        display_name: displayName,
        access_token: accessToken,
        token_expires_at: tokenExpiresAt,
      })
    }

    return makeRedirect("/dashboard/social-accounts?status=success&platform=linkedin")
  } catch (error) {
    console.error("LinkedIn callback error:", error)
    const origin = (() => {
      try {
        return new URL(req.url).origin
      } catch {
        return "http://localhost:3000"
      }
    })()
    const target = new URL("/dashboard/social-accounts?status=error&reason=unknown", origin)
    return Response.redirect(target.toString())
  }
}
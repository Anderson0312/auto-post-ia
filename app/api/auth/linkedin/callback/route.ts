import { DatabaseService } from "@/lib/database"
import { verifyJwt } from "@/lib/jwt"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state") || ""

    if (!code) {
      return Response.redirect("/dashboard/social-accounts?status=error&reason=missing_code")
    }

    // Decode state (JWT token) to identify the user
    let userId: string | null = null
    if (state) {
      try {
        const payload = await verifyJwt<{ userId: string }>(state)
        userId = payload.userId
      } catch (err) {
        console.error("Invalid LinkedIn state token:", err)
      }
    }

    if (!userId) {
      return Response.redirect("/dashboard/social-accounts?status=error&reason=unauthorized")
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return Response.redirect("/dashboard/social-accounts?status=error&reason=misconfigured")
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
      return Response.redirect("/dashboard/social-accounts?status=error&reason=token_exchange_failed")
    }

    const tokenData = await tokenResponse.json()
    const accessToken: string = tokenData.access_token
    const expiresIn: number = tokenData.expires_in

    // Fetch profile info
    const profileRes = await fetch("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!profileRes.ok) {
      const errText = await profileRes.text()
      console.error("LinkedIn profile fetch failed:", errText)
      return Response.redirect("/dashboard/social-accounts?status=error&reason=profile_failed")
    }

    const profile = await profileRes.json()
    const platformUserId: string = profile.id
    const firstName = profile.localizedFirstName || ""
    const lastName = profile.localizedLastName || ""

    // Fetch email (optional)
    let username = platformUserId
    try {
      const emailRes = await fetch(
        "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
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

    const displayName = `${firstName} ${lastName}`.trim()
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

    return Response.redirect("/dashboard/social-accounts?status=success&platform=linkedin")
  } catch (error) {
    console.error("LinkedIn callback error:", error)
    return Response.redirect("/dashboard/social-accounts?status=error&reason=unknown")
  }
}
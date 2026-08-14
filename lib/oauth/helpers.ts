import { type NextRequest, NextResponse } from "next/server"
import { createHash, randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { DatabaseService } from "@/lib/database"
import { attachSessionCookie, createUserSession, getUserIdFromRequest } from "@/lib/session"

export function oauthRedirect(req: NextRequest, path: string) {
  let origin = "http://localhost:3000"
  try {
    origin = new URL(req.url).origin
  } catch {
    origin = process.env.NEXT_PUBLIC_API_URL || origin
  }
  return NextResponse.redirect(new URL(path, origin).toString())
}

export function encodeOAuthState(payload: Record<string, string>) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url")
}

export function decodeOAuthState(state: string | null): Record<string, string> | null {
  if (!state) return null
  try {
    return JSON.parse(Buffer.from(state, "base64url").toString("utf-8"))
  } catch {
    return null
  }
}

export function createPkce() {
  const makeBase64Url = (buf: Buffer) =>
    buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  const verifier = makeBase64Url(randomBytes(32))
  const challenge = makeBase64Url(createHash("sha256").update(verifier).digest())
  return { verifier, challenge }
}

export async function upsertSocialAccount(params: {
  userId: string
  platform: string
  platformUserId: string
  username: string
  displayName?: string
  accessToken: string
  refreshToken?: string
  tokenExpiresAt?: string | null
  followersCount?: number
  avatarUrl?: string
}) {
  const existing = await DatabaseService.getSocialAccount(
    params.userId,
    params.platform,
    params.platformUserId,
  )

  const updates = {
    username: params.username,
    display_name: params.displayName || params.username,
    access_token: params.accessToken,
    refresh_token: params.refreshToken,
    token_expires_at: params.tokenExpiresAt,
    is_connected: true,
    is_active: true,
    followers_count: params.followersCount,
    avatar_url: params.avatarUrl,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    await DatabaseService.updateSocialAccount(existing.id, updates)
    return existing.id as string
  }

  const created = await DatabaseService.createSocialAccount({
    user_id: params.userId,
    platform: params.platform,
    platform_user_id: params.platformUserId,
    username: params.username,
    display_name: params.displayName || params.username,
    access_token: params.accessToken,
    refresh_token: params.refreshToken,
    token_expires_at: params.tokenExpiresAt || undefined,
    followers_count: params.followersCount,
    avatar_url: params.avatarUrl,
  })
  return created.id as string
}

export async function resolveOAuthUser(params: {
  req: NextRequest
  platform: string
  platformUserId: string
  email?: string | null
  name: string
}): Promise<{ userId: string; createdSession: boolean }> {
  const sessionUserId = await getUserIdFromRequest(params.req)
  if (sessionUserId) {
    return { userId: sessionUserId, createdSession: false }
  }

  const linked = await DatabaseService.getSocialAccountByPlatformUser(
    params.platform,
    params.platformUserId,
  )
  if (linked?.user_id) {
    return { userId: linked.user_id, createdSession: true }
  }

  if (params.email) {
    try {
      const existing = await DatabaseService.getUserByEmail(params.email)
      if (existing?.id) {
        return { userId: existing.id, createdSession: true }
      }
    } catch {
      // e-mail ainda não cadastrado
    }
  }

  const email =
    params.email ||
    `${params.platform}_${params.platformUserId.replace(/[^a-zA-Z0-9]/g, "")}@oauth.autopostia.local`
  const hashedPassword = await bcrypt.hash(crypto.randomUUID(), 12)
  const user = await DatabaseService.createUser({
    name: params.name || `${params.platform} user`,
    email,
    password: hashedPassword,
  })
  await DatabaseService.createUserSettings(user.id)
  return { userId: user.id, createdSession: true }
}

export async function finishOAuth(
  req: NextRequest,
  userId: string,
  createdSession: boolean,
  platform: string,
) {
  const destination = createdSession
    ? `/dashboard?status=success&platform=${platform}`
    : `/dashboard/social-accounts?status=success&platform=${platform}`
  const res = oauthRedirect(req, destination)
  if (createdSession) {
    const { sessionToken, expiresAt } = await createUserSession(userId, req)
    attachSessionCookie(res, sessionToken, expiresAt)
  }
  return res
}

import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/database"

function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function createUserSession(userId: string, request: NextRequest) {
  const sessionToken = randomToken(32)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  const ip = (request.headers.get("x-forwarded-for") || request.ip || "").toString()
  const userAgent = request.headers.get("user-agent") || ""

  const { error } = await supabaseAdmin.from("user_sessions").insert([
    {
      user_id: userId,
      session_token: sessionToken,
      ip_address: ip || null,
      user_agent: userAgent || null,
      expires_at: expiresAt.toISOString(),
    },
  ])

  if (error) throw error

  return { sessionToken, expiresAt }
}

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const cookie = request.cookies.get("session_token")?.value
    if (!cookie) return null

    const { data, error } = await supabaseAdmin
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("session_token", cookie)
      .single()

    if (error) return null
    if (!data) return null
    if (new Date(data.expires_at) < new Date()) return null
    return data.user_id as string
  } catch (e) {
    return null
  }
}

export async function clearUserSession(token: string) {
  try {
    await supabaseAdmin.from("user_sessions").delete().eq("session_token", token)
  } catch (e) {
    // ignore
  }
}

export function attachSessionCookie(response: NextResponse, sessionToken: string, expiresAt: Date) {
  response.cookies.set("session_token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  })
}
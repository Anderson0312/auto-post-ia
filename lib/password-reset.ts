import { signToken, verifyJwt } from "@/lib/jwt"
import { supabaseAdmin } from "@/lib/database"

// Generate a secure reset token
export async function generateResetToken(userId: string): Promise<string> {
  // Create a token that expires in 1 hour
  const token = await signToken(
    {
      userId,
      type: "password_reset",
      timestamp: Date.now(),
    },
    "1h",
  )

  // Optionally store token in database for additional security
  await supabaseAdmin.from("password_reset_tokens").insert([
    {
      user_id: userId,
      token_hash: await hashToken(token),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      used: false,
    },
  ])

  return token
}

// Verify reset token and return user ID if valid
export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    // Verify JWT token
    const decoded = await verifyJwt<{
      userId: string
      type: string
      timestamp: number
    }>(token)

    // Check if it's a password reset token
    if (decoded.type !== "password_reset") {
      return null
    }

    // Check if token exists in database and is not used
    const tokenHash = await hashToken(token)
    const { data: tokenRecord } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .eq("used", false)
      .single()

    if (!tokenRecord) {
      return null
    }

    // Check if token is expired
    if (new Date() > new Date(tokenRecord.expires_at)) {
      return null
    }

    // Mark token as used
    await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", tokenRecord.id)

    return decoded.userId
  } catch (error) {
    console.error("Error verifying reset token:", error)
    return null
  }
}

// Hash token for secure storage
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

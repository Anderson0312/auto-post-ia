import type { NextRequest } from "next/server"
import { signToken, verifyJwt } from "@/lib/jwt"

export async function verifyToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = await verifyJwt<{ userId: string }>(token)

    return decoded.userId
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

export async function generateToken(userId: string, email: string): Promise<string> {
  return await signToken({ userId, email })
}

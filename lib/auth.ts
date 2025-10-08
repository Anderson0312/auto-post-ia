import type { NextRequest } from "next/server"
import { signToken } from "@/lib/jwt"
import { getUserIdFromRequest } from "@/lib/session"

// Agora, verifyToken retorna o userId a partir do cookie de sessão.
export async function verifyToken(request: NextRequest): Promise<string | null> {
  return await getUserIdFromRequest(request)
}

export async function generateToken(userId: string, email: string): Promise<string> {
  // Mantido por compatibilidade, embora o cliente não salve mais token.
  return await signToken({ userId, email })
}

import { SignJWT, jwtVerify, type JWTPayload } from "jose"

/**
 * Gera um JWT assinado usando a Web Crypto API (Edge friendly).
 * @param payload  Dados que farão parte do token
 * @param expiresIn  Tempo de expiração (ex.: "7d", "2h")
 */
export async function signToken(payload: JWTPayload, expiresIn = "7d"): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime(expiresIn).sign(secret)
}

/**
 * Valida um JWT e devolve o payload.
 */
export async function verifyJwt<T extends JWTPayload = JWTPayload>(token: string): Promise<T> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const { payload } = await jwtVerify<T>(token, secret)
  return payload
}

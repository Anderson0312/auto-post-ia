import { SignJWT } from "jose"

export async function createKlingJwt(accessKey: string, secretKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(accessKey)
    .setExpirationTime(now + 1800)
    .setNotBefore(now - 5)
    .sign(new TextEncoder().encode(secretKey))
}

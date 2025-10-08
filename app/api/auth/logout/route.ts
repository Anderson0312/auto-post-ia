import { type NextRequest, NextResponse } from "next/server"
import { clearUserSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value

    const res = NextResponse.json({ message: "Sessão encerrada" })
    // Expira o cookie imediatamente
    res.cookies.set("session_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
    })

    if (token) await clearUserSession(token)
    return res
  } catch (e) {
    return NextResponse.json({ message: "Sessão encerrada" })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { signToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    // Get demo user from database
    const demoUser = await DatabaseService.getUserByEmail("demo@autopostia.com")

    if (!demoUser) {
      return NextResponse.json({ error: "Usuário demo não encontrado" }, { status: 404 })
    }

    // Generate JWT token for demo user
    const token = await signToken({ userId: demoUser.id, email: demoUser.email }, "2h")

    // Update last login
    await DatabaseService.updateUser(demoUser.id, {
      last_login_at: new Date().toISOString(),
    })

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = demoUser

    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: "Acesso demo autorizado!",
      isDemo: true,
    })
  } catch (error) {
    console.error("Demo login error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 })
    }

    // Get user by email
    const user = await DatabaseService.getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Generate JWT token
    const token = await signToken({ userId: user.id, email: user.email })

    // Update last login
    await DatabaseService.updateUser(user.id, {
      last_login_at: new Date().toISOString(),
    })

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: "Login realizado com sucesso!",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

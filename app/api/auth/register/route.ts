import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/jwt"
import { createUserSession, attachSessionCookie } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, acceptTerms } = await request.json()

    // Validation
    if (!name || !email || !password || !acceptTerms) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres" }, { status: 400 })
    }

    // Check if user already exists
    try {
      const existingUser = await DatabaseService.getUserByEmail(email)
      if (existingUser) {
        return NextResponse.json({ error: "Usuário já existe com este e-mail" }, { status: 409 })
      }
    } catch (error) {
      // User doesn't exist, continue with registration
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await DatabaseService.createUser({
      name,
      email,
      password: hashedPassword,
    })

    // Create default user settings
    await DatabaseService.createUserSettings(user.id)

    // Create default AI configuration
    await DatabaseService.updateAIConfiguration(user.id, {
      posts_per_day: 2,
      post_times: ["09:00", "15:00"],
      post_objective: "engagement",
      content_style: "professional",
      generate_images: true,
    })

    // Create session and set cookie HttpOnly
    const { sessionToken, expiresAt } = await createUserSession(user.id, request)

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    const res = NextResponse.json({
      user: userWithoutPassword,
      token: await signToken({ userId: user.id, email: user.email }),
      message: "Conta criada com sucesso!",
    })
    attachSessionCookie(res, sessionToken, expiresAt)
    return res
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

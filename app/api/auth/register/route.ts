import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/jwt"

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

    // Generate JWT token
    const token = await signToken({ userId: user.id, email: user.email })

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: "Conta criada com sucesso!",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

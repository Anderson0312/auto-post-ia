import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { verifyResetToken } from "@/lib/password-reset"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    // Validation
    if (!token || !password) {
      return NextResponse.json({ error: "Token e senha são obrigatórios" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres" }, { status: 400 })
    }

    // Verify reset token
    const userId = await verifyResetToken(token)
    if (!userId) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password
    await DatabaseService.updateUser(userId, {
      password: hashedPassword,
      updated_at: new Date().toISOString(),
    })

    // Invalidate the reset token (optional - tokens expire anyway)
    // await DatabaseService.invalidateResetToken(token)

    return NextResponse.json({
      message: "Senha redefinida com sucesso!",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token é obrigatório" }, { status: 400 })
    }

    // Verify if token is valid
    const userId = await verifyResetToken(token)
    const isValid = !!userId

    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error("Verify reset token error:", error)
    return NextResponse.json({ valid: false })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { generateResetToken } from "@/lib/password-reset"
import { sendPasswordResetEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validation
    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 })
    }

    // Check if user exists
    let user
    try {
      user = await DatabaseService.getUserByEmail(email)
    } catch (error) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: "Se o e-mail estiver cadastrado, você receberá instruções de recuperação.",
      })
    }

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: "Se o e-mail estiver cadastrado, você receberá instruções de recuperação.",
      })
    }

    // Generate reset token
    const resetToken = await generateResetToken(user.id)

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken)

    return NextResponse.json({
      message: "Se o e-mail estiver cadastrado, você receberá instruções de recuperação.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { DatabaseService } from "@/lib/database"
import bcrypt from "bcryptjs"
import { emailService } from "@/lib/email-service"

export async function PUT(request: NextRequest) {
  try {
    const userId = await verifyToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    // Validação básica
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Senha atual e nova senha são obrigatórias" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "A nova senha deve ter pelo menos 8 caracteres" }, { status: 400 })
    }

    // Buscar usuário
    const user = await DatabaseService.getUserById(userId)
    if (!user || !user.password) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Verificar senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Atualizar senha
    await DatabaseService.updateUser(userId, {
      password: hashedPassword,
      updated_at: new Date().toISOString(),
    })
    
    // Enviar notificação por e-mail sobre alteração de senha
    try {
      const notificationSettings = await DatabaseService.getNotificationSettings(userId)
      
      if (notificationSettings.emailNotifications && notificationSettings.accountActivity) {
        await emailService.sendAccountActivityEmail(
        user.email,
        user.name,
        "alteração de senha",
        new Date().toISOString(),
        "aplicação web"
      )
      }
    } catch (error) {
      console.error("Erro ao enviar notificação de alteração de senha:", error)
      // Não interrompe o fluxo se a notificação falhar
    }

    return NextResponse.json({
      message: "Senha atualizada com sucesso!",
    })
  } catch (error) {
    console.error("Update password error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
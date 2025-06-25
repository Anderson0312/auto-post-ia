import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = await DatabaseService.getUserById(userId)

    // Remove sensitive data
    const { password, ...userProfile } = user

    return NextResponse.json({ user: userProfile })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await verifyToken(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const updates = await request.json()

    // Remove sensitive fields that shouldn't be updated via this endpoint
    const { password, email, id, created_at, updated_at, ...allowedUpdates } = updates

    const updatedUser = await DatabaseService.updateUser(userId, allowedUpdates)

    // Remove sensitive data
    const { password: _, ...userProfile } = updatedUser

    return NextResponse.json({
      user: userProfile,
      message: "Perfil atualizado com sucesso!",
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

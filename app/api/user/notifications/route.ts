import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/session"
import { DatabaseService } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const notificationSettings = await DatabaseService.getNotificationSettings(userId)
    return NextResponse.json(notificationSettings)
  } catch (error) {
    console.error("Erro ao obter preferências de notificação:", error)
    return NextResponse.json({ error: "Erro ao obter preferências de notificação" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const settings = await request.json()

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const updatedSettings = await DatabaseService.updateNotificationSettings(userId, settings)
    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error("Erro ao atualizar preferências de notificação:", error)
    return NextResponse.json({ error: "Erro ao atualizar preferências de notificação" }, { status: 500 })
  }
}

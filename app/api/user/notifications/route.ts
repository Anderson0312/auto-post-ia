import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { DatabaseService } from "@/lib/database"

// GET: Obter preferências de notificação do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    const userId = session.user.id
    
    // Buscar preferências de notificação do usuário
    const notificationSettings = await DatabaseService.getNotificationSettings(userId)
    
    return NextResponse.json(notificationSettings)
  } catch (error) {
    console.error("Erro ao obter preferências de notificação:", error)
    return NextResponse.json({ error: "Erro ao obter preferências de notificação" }, { status: 500 })
  }
}

// PUT: Atualizar preferências de notificação do usuário
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    
    const userId = session.user.id
    const settings = await request.json()
    
    // Validar os dados recebidos
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    
    // Atualizar preferências de notificação
    const updatedSettings = await DatabaseService.updateNotificationSettings(userId, settings)
    
    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error("Erro ao atualizar preferências de notificação:", error)
    return NextResponse.json({ error: "Erro ao atualizar preferências de notificação" }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { SchedulerService } from "@/lib/scheduler"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

/**
 * Controla o scheduler (apenas para administradores)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se é admin (implementar verificação de admin)
    const user = await DatabaseService.getUserById(userId)
    if (user.role !== 'admin') {
      return NextResponse.json({ error: "Acesso negado. Apenas administradores." }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'start':
        SchedulerService.start()
        return NextResponse.json({ message: "Scheduler iniciado" })
      
      case 'stop':
        SchedulerService.stop()
        return NextResponse.json({ message: "Scheduler parado" })
      
      case 'run_automation':
        await SchedulerService.runManualAutomation()
        return NextResponse.json({ message: "Automação executada manualmente" })
      
      case 'run_processing':
        await SchedulerService.runManualProcessing()
        return NextResponse.json({ message: "Processamento executado manualmente" })
      
      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error controlling scheduler:", error)
    return NextResponse.json({ error: "Erro ao controlar scheduler" }, { status: 500 })
  }
}

/**
 * Obtém status do scheduler
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se é admin
    const user = await DatabaseService.getUserById(userId)
    if (user.role !== 'admin') {
      return NextResponse.json({ error: "Acesso negado. Apenas administradores." }, { status: 403 })
    }

    const stats = SchedulerService.getStats()

    return NextResponse.json({
      scheduler: stats,
      message: stats.isRunning ? "Scheduler ativo" : "Scheduler inativo",
    })
  } catch (error) {
    console.error("Error getting scheduler status:", error)
    return NextResponse.json({ error: "Erro ao obter status do scheduler" }, { status: 500 })
  }
}

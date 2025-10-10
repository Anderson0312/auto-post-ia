import { type NextRequest, NextResponse } from "next/server"
import { AutomationService } from "@/lib/automation-service"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

/**
 * Executa automação manual para o usuário atual
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { generateImage = true } = body || {}

    // Verificar se o usuário tem configuração de automação
    const config = await AutomationService.getAutomationConfig(userId)
    if (!config) {
      return NextResponse.json(
        { error: "Configuração de automação não encontrada. Configure primeiro na página de configuração da IA." },
        { status: 400 }
      )
    }

    if (!config.socialAccounts.length) {
      return NextResponse.json(
        { error: "Nenhuma conta social conectada. Conecte pelo menos uma conta para usar a automação." },
        { status: 400 }
      )
    }

    // Executar automação
    await AutomationService.generateAutomatedPosts(userId)

    return NextResponse.json({
      message: "Automação executada com sucesso",
      config: {
        themes: config.themes,
        postsPerDay: config.postsPerDay,
        postTimes: config.postTimes,
        connectedAccounts: config.socialAccounts.filter(acc => acc.isActive).length,
      },
    })
  } catch (error) {
    console.error("Error running automation:", error)
    return NextResponse.json({ error: "Erro ao executar automação" }, { status: 500 })
  }
}

/**
 * Obtém status da automação do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar configuração
    const config = await AutomationService.getAutomationConfig(userId)
    if (!config) {
      return NextResponse.json({ 
        status: "not_configured",
        message: "Automação não configurada"
      })
    }

    // Buscar posts de hoje
    const todayPosts = await DatabaseService.getPostsForToday(userId)
    
    // Buscar posts agendados
    const scheduledPosts = await DatabaseService.getScheduledPosts(userId)

    return NextResponse.json({
      status: "configured",
      config: {
        themes: config.themes,
        postsPerDay: config.postsPerDay,
        postTimes: config.postTimes,
        contentStyle: config.contentStyle,
        generateImages: config.generateImages,
        postObjective: config.postObjective,
        language: config.language,
        postFormat: config.postFormat,
      },
      stats: {
        postsToday: todayPosts.length,
        remainingPosts: Math.max(0, config.postsPerDay - todayPosts.length),
        scheduledPosts: scheduledPosts.length,
        connectedAccounts: config.socialAccounts.filter(acc => acc.isActive).length,
      },
      nextExecution: "Próxima execução automática em até 1 hora",
    })
  } catch (error) {
    console.error("Error getting automation status:", error)
    return NextResponse.json({ error: "Erro ao obter status da automação" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Obter dados do usuário para verificar o tipo de plano
    const user = await DatabaseService.getUserById(userId)
    
    // Obter dados de uso do mês atual
    const usage = await DatabaseService.getUserUsage(userId)
    
    // Definir limites com base no tipo de plano
    const planLimits = {
      free: {
        posts: 10,
        ai_generations: 20,
      },
      pro: {
        posts: 100,
        ai_generations: 200,
      },
      enterprise: {
        posts: 1000,
        ai_generations: 2000,
      }
    }
    
    // Obter o tipo de plano do usuário (com fallback para 'free')
    const planType = user?.plan_type || 'free'
    
    // Obter os limites com base no tipo de plano
    const limits = planLimits[planType as keyof typeof planLimits]
    
    // Obter dados de faturamento (se existirem)
    const billing = user?.billing?.[0] || { status: 'active' }
    
    return NextResponse.json({
      plan: {
        type: planType,
        status: billing.status,
        limits
      },
      usage: {
        posts_created: usage.posts_created || 0,
        posts_published: usage.posts_published || 0,
        ai_generations: usage.ai_generations || 0
      }
    })
  } catch (error: any) {
    console.error("GET /api/user/plan error:", error?.message || error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
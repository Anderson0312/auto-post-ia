import { type NextRequest, NextResponse } from "next/server"
import { SchedulerService } from "@/lib/scheduler"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

/**
 * Agenda um post específico para um horário específico
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      socialAccountId, 
      theme, 
      scheduledFor, 
      generateImage = true 
    } = body

    // Validações
    if (!socialAccountId) {
      return NextResponse.json({ error: "ID da conta social é obrigatório" }, { status: 400 })
    }

    if (!theme) {
      return NextResponse.json({ error: "Tema é obrigatório" }, { status: 400 })
    }

    if (!scheduledFor) {
      return NextResponse.json({ error: "Data de agendamento é obrigatória" }, { status: 400 })
    }

    const scheduledDate = new Date(scheduledFor)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: "Data de agendamento inválida" }, { status: 400 })
    }

    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: "Data de agendamento deve ser no futuro" }, { status: 400 })
    }

    // Agendar post
    await SchedulerService.scheduleSpecificPost({
      userId,
      socialAccountId,
      theme,
      scheduledFor: scheduledDate,
      generateImage,
    })

    return NextResponse.json({
      message: "Post agendado com sucesso",
      scheduledFor: scheduledDate.toISOString(),
    })
  } catch (error) {
    console.error("Error scheduling post:", error)
    return NextResponse.json({ error: "Erro ao agendar post" }, { status: 500 })
  }
}

/**
 * Lista posts agendados do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const scheduledPosts = await DatabaseService.getScheduledPosts(userId)

    return NextResponse.json({
      posts: scheduledPosts.map(post => ({
        id: post.id,
        content: post.content,
        platform: post.platform,
        scheduledFor: post.scheduled_for,
        status: post.status,
        imageUrl: post.image_url,
        hashtags: post.hashtags,
      })),
    })
  } catch (error) {
    console.error("Error getting scheduled posts:", error)
    return NextResponse.json({ error: "Erro ao buscar posts agendados" }, { status: 500 })
  }
}

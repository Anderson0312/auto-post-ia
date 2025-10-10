import { type NextRequest, NextResponse } from "next/server"
import { SchedulerService } from "@/lib/scheduler"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

/**
 * Cancela um post agendado
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const postId = params.id

    // Verificar se o post pertence ao usuário
    const post = await DatabaseService.getPostById(postId)
    if (!post || post.user_id !== userId) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })
    }

    // Verificar se pode ser cancelado
    if (post.status === 'published') {
      return NextResponse.json({ error: "Post já foi publicado e não pode ser cancelado" }, { status: 400 })
    }

    // Cancelar post
    await DatabaseService.updatePost(postId, {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })

    // Cancelar item da fila se existir
    await DatabaseService.cancelQueueItem(postId)

    return NextResponse.json({
      message: "Post cancelado com sucesso",
    })
  } catch (error) {
    console.error("Error canceling post:", error)
    return NextResponse.json({ error: "Erro ao cancelar post" }, { status: 500 })
  }
}

/**
 * Reagenda um post
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const postId = params.id
    const body = await request.json()
    const { scheduledFor } = body

    // Validações
    if (!scheduledFor) {
      return NextResponse.json({ error: "Nova data de agendamento é obrigatória" }, { status: 400 })
    }

    const newScheduledDate = new Date(scheduledFor)
    if (isNaN(newScheduledDate.getTime())) {
      return NextResponse.json({ error: "Data de agendamento inválida" }, { status: 400 })
    }

    if (newScheduledDate <= new Date()) {
      return NextResponse.json({ error: "Data de agendamento deve ser no futuro" }, { status: 400 })
    }

    // Verificar se o post pertence ao usuário
    const post = await DatabaseService.getPostById(postId)
    if (!post || post.user_id !== userId) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })
    }

    // Verificar se pode ser reagendado
    if (post.status === 'published') {
      return NextResponse.json({ error: "Post já foi publicado e não pode ser reagendado" }, { status: 400 })
    }

    if (post.status === 'failed') {
      return NextResponse.json({ error: "Post falhou e não pode ser reagendado" }, { status: 400 })
    }

    // Reagendar post
    await DatabaseService.updatePost(postId, {
      scheduled_for: newScheduledDate.toISOString(),
      status: 'scheduled',
      updated_at: new Date().toISOString(),
    })

    // Atualizar item da fila
    await DatabaseService.updateQueueItemByPostId(postId, {
      scheduled_for: newScheduledDate.toISOString(),
      status: 'pending',
      attempts: 0,
      error_message: null,
    })

    return NextResponse.json({
      message: "Post reagendado com sucesso",
      newScheduledFor: newScheduledDate.toISOString(),
    })
  } catch (error) {
    console.error("Error rescheduling post:", error)
    return NextResponse.json({ error: "Erro ao reagendar post" }, { status: 500 })
  }
}

/**
 * Obtém detalhes de um post específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const postId = params.id

    // Buscar post
    const post = await DatabaseService.getPostById(postId)
    if (!post || post.user_id !== userId) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })
    }

    // Buscar conta social
    const socialAccount = await DatabaseService.getSocialAccountById(post.social_account_id)

    return NextResponse.json({
      post: {
        id: post.id,
        content: post.content,
        imageUrl: post.image_url,
        imagePrompt: post.image_prompt,
        hashtags: post.hashtags,
        scheduledFor: post.scheduled_for,
        publishedAt: post.published_at,
        status: post.status,
        errorMessage: post.error_message,
        platformPostId: post.platform_post_id,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        platform: socialAccount.platform,
        platformUsername: socialAccount.username,
        metrics: {
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          sharesCount: post.shares_count,
          viewsCount: post.views_count,
          engagementRate: post.engagement_rate,
        },
      },
    })
  } catch (error) {
    console.error("Error getting post details:", error)
    return NextResponse.json({ error: "Erro ao buscar detalhes do post" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { AutomationService } from "@/lib/automation-service"
import { getUserIdFromRequest } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { postId, status, platform, limit } = body || {}

    // Helper to (re)enfileirar um post
    async function requeuePost(targetPostId: string) {
      const post = await DatabaseService.getPostById(targetPostId)
      if (!post || post.user_id !== userId) return false

      // Cancelar itens antigos da fila para este post (se houver)
      try { await DatabaseService.cancelQueueItem(targetPostId) } catch {}

      // Reagendar para agora
      const scheduledFor = new Date()
      await AutomationService.addToProcessingQueue({
        postId: targetPostId,
        userId,
        scheduledFor,
      })

      // Atualizar status do post para "scheduled" e limpar mensagem de erro
      await DatabaseService.updatePostStatus(targetPostId, "scheduled", { error_message: null })

      // Log informativo
      try {
        const socialAccount = await DatabaseService.getSocialAccountById(post.social_account_id)
        await DatabaseService.createPostLog({
          user_id: userId,
          post_id: targetPostId,
          social_account_id: post.social_account_id,
          platform: socialAccount.platform,
          status: "info",
          message: "Post reenfileirado para reprocessamento",
          context: { reason: body?.reason || (status ? `bulk_resend_${status}` : "manual_resend") },
        })
      } catch {}

      return true
    }

    if (postId) {
      const ok = await requeuePost(postId)
      if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 })
      return NextResponse.json({ message: "post_resent", count: 1 })
    }

    // Reenvio em lote pelos statuses (error/failed)
    const validStatuses = ["error", "failed"]
    const statuses: string[] = status && validStatuses.includes(status) ? [status] : validStatuses
    const max = typeof limit === "number" ? Math.max(1, Math.min(200, limit)) : 50

    // Buscar posts do usuário com os statuses desejados
    const posts = await DatabaseService.getPosts(userId, 500)
    const filtered = posts.filter((p: any) => statuses.includes(p.status) && (!platform || (p.social_accounts?.platform || p.platform) === platform))
    const toProcess = filtered.slice(0, max)

    let processed = 0
    for (const p of toProcess) {
      const ok = await requeuePost(p.id)
      if (ok) processed += 1
    }

    return NextResponse.json({ message: "bulk_posts_resent", count: processed })
  } catch (error: any) {
    console.error("POST /api/posts/resend error:", error?.message || error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
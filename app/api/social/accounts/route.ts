import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService, supabaseAdmin } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    const accounts = await DatabaseService.getSocialAccounts(userId)

    // Enriquecer com last_post_at (último post publicado)
    const enriched = [] as any[]
    for (const acc of accounts || []) {
      let lastPostAt: string | null = null
      try {
        const { data: posts } = await supabaseAdmin
          .from("posts")
          .select("published_at")
          .eq("social_account_id", acc.id)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(1)
        if (Array.isArray(posts) && posts.length > 0) {
          lastPostAt = posts[0]?.published_at || null
        }
      } catch (e) {
        // ignore
      }

      enriched.push({ ...acc, last_post_at: lastPostAt })
    }

    return NextResponse.json({ accounts: enriched })
  } catch (error) {
    console.error("Error fetching social accounts:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
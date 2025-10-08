import { NextResponse, type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

async function fetchInstagramFollowers(accessToken: string, platformUserId: string): Promise<number | null> {
  try {
    const url = `https://graph.instagram.com/v18.0/${platformUserId}?fields=followers_count&access_token=${accessToken}`
    const res = await fetch(url)
    if (!res.ok) {
      return null
    }
    const json = await res.json()
    const count = typeof json.followers_count === "number" ? json.followers_count : null
    return count ?? null
  } catch (err) {
    console.warn("Instagram followers fetch failed:", err)
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    const { id: accountId } = await params

    const { data: account, error: findErr } = await supabaseAdmin
      .from("social_accounts")
      .select("*")
      .eq("id", accountId)
      .single()

    if (findErr || !account) {
      return NextResponse.json({ error: "Conta social não encontrada" }, { status: 404 })
    }
    if (account.user_id !== userId) {
      return NextResponse.json({ error: "Proibido" }, { status: 403 })
    }

    const platform = String(account.platform || "").toLowerCase()
    let followers: number | null = null
    let reason: string | undefined

    if (!account.access_token || !account.platform_user_id) {
      reason = "missing_token_or_platform_user_id"
    } else {
      switch (platform) {
        case "instagram": {
          followers = await fetchInstagramFollowers(account.access_token, account.platform_user_id)
          if (followers == null) reason = "instagram_graph_unavailable_or_permissions"
          break
        }
        case "linkedin": {
          // LinkedIn não expõe followers de perfis pessoais com escopos mínimos.
          reason = "linkedin_not_supported_for_personal_profiles"
          break
        }
        case "facebook": {
          // Requer page token e endpoint de Page Graph.
          reason = "facebook_requires_page_token_and_graph_endpoint"
          break
        }
        case "twitter": {
          // Requer API paga/assinatura e chaves.
          reason = "twitter_not_supported_without_enterprise_api"
          break
        }
        default: {
          reason = "platform_not_supported"
        }
      }
    }

    let updated = false
    if (typeof followers === "number" && followers >= 0) {
      const { error: updErr } = await supabaseAdmin
        .from("social_accounts")
        .update({ followers_count: followers })
        .eq("id", accountId)

      if (!updErr) updated = true
    }

    return NextResponse.json({
      accountId,
      platform,
      updated,
      followers_count: followers ?? account.followers_count ?? null,
      reason,
    })
  } catch (error) {
    console.error("Error refreshing followers:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    const { id: accountId } = await params

    const { data, error } = await supabaseAdmin
      .from("social_accounts")
      .update({
        is_connected: false,
        is_active: false,
        access_token: "",
        token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })

    return NextResponse.json({ account: data, message: "Conta desconectada" })
  } catch (error) {
    console.error("Error disconnecting social account:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
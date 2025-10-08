import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { supabaseAdmin } from "@/lib/database"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { active } = body as { active?: boolean }
    if (typeof active !== "boolean") {
      return NextResponse.json({ error: "Parâmetro 'active' inválido" }, { status: 400 })
    }

    const userId = payload.userId
    const { id: accountId } = await params

    const { data, error } = await supabaseAdmin
      .from("social_accounts")
      .update({
        is_active: active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })

    return NextResponse.json({ account: data, message: "Estado de atividade atualizado" })
  } catch (error) {
    console.error("Error toggling social account activity:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
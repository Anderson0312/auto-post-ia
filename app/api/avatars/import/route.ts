import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/session"
import { AvatarService } from "@/lib/avatars/avatar-service"

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await request.json()
    if (!body.name || !body.images?.length) {
      return NextResponse.json({ error: "Nome e imagens são obrigatórios" }, { status: 400 })
    }

    const avatar = await AvatarService.importFromImages(userId, body)
    return NextResponse.json({ avatar, message: "Avatar importado com sucesso" }, { status: 201 })
  } catch (error) {
    console.error("POST /api/avatars/import:", error)
    return NextResponse.json({ error: "Erro ao importar avatar" }, { status: 500 })
  }
}

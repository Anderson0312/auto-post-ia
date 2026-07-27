import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/session"
import { VideoDatabaseService } from "@/lib/video-database"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const avatar = await VideoDatabaseService.getAvatarById(userId, id)
    return NextResponse.json({ avatar })
  } catch (error) {
    console.error("GET /api/avatars/[id]:", error)
    return NextResponse.json({ error: "Avatar não encontrado" }, { status: 404 })
  }
}

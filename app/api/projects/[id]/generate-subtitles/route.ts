import { type NextRequest, NextResponse } from "next/server"
import { SubtitlesService } from "@/lib/audio/subtitles-service"
import { getUserIdFromRequest } from "@/lib/session"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const result = await SubtitlesService.generateForProject(id, userId)
    return NextResponse.json({ message: "Legendas geradas", ...result })
  } catch (error) {
    console.error("POST generate-subtitles:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar legendas" },
      { status: 500 },
    )
  }
}

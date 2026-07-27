import { type NextRequest, NextResponse } from "next/server"
import { NarrationService } from "@/lib/audio/narration-service"
import { getUserIdFromRequest } from "@/lib/session"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const result = await NarrationService.generateForProject(id, userId)
    return NextResponse.json({ message: "Narração gerada", ...result })
  } catch (error) {
    console.error("POST generate-narration:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar narração" },
      { status: 500 },
    )
  }
}

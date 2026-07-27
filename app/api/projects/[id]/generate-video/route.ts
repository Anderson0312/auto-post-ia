import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/session"
import { enqueueVideoGeneration } from "@/lib/pipeline/enqueue"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const result = await enqueueVideoGeneration(id, userId)
    return NextResponse.json({ message: "Geração de vídeo iniciada", ...result })
  } catch (error) {
    console.error("POST generate-video:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar vídeo" },
      { status: 500 },
    )
  }
}

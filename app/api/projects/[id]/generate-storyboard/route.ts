import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/session"
import { enqueueStoryboardGeneration } from "@/lib/pipeline/enqueue"

export const maxDuration = 800

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const result = await enqueueStoryboardGeneration(id, userId)
    return NextResponse.json({ message: "Geração de storyboard iniciada", ...result })
  } catch (error) {
    console.error("POST generate-storyboard:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar storyboard" },
      { status: 500 },
    )
  }
}

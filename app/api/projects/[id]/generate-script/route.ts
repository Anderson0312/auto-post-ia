import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/session"
import { enqueueScriptGeneration } from "@/lib/pipeline/enqueue"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const result = await enqueueScriptGeneration(id, userId)
    return NextResponse.json({ message: "Geração de roteiro iniciada", ...result })
  } catch (error) {
    console.error("POST generate-script:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar roteiro" },
      { status: 500 },
    )
  }
}

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
    const project = await VideoDatabaseService.getProjectById(userId, id)
    return NextResponse.json({ project })
  } catch (error) {
    console.error("GET /api/projects/[id]:", error)
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const result = await VideoDatabaseService.deleteProject(userId, id)
    return NextResponse.json({ message: "Vídeo apagado", ...result })
  } catch (error) {
    console.error("DELETE /api/projects/[id]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao apagar vídeo" },
      { status: 500 },
    )
  }
}

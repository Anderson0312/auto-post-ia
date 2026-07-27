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
    const jobs = await VideoDatabaseService.getProjectJobs(id)
    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("GET /api/projects/[id]/jobs:", error)
    return NextResponse.json({ error: "Erro ao listar jobs" }, { status: 500 })
  }
}

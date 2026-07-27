import { type NextRequest, NextResponse } from "next/server"
import { ProjectExportService } from "@/lib/projects/export-service"
import { getUserIdFromRequest } from "@/lib/session"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const bundle = await ProjectExportService.buildExportBundle(id, userId)
    return NextResponse.json(bundle)
  } catch (error) {
    console.error("GET export:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao exportar projeto" },
      { status: 500 },
    )
  }
}

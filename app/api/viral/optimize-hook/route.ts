import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/session"
import { ViralEngineService } from "@/lib/viral-engine/viral-engine-service"
import type { ContentObjective } from "@/lib/types/video-platform"

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await request.json()
    const result = await ViralEngineService.optimizeHook({
      hook: body.hook,
      fullScript: body.fullScript,
      platform: body.platform || "instagram",
      objective: (body.objective || "engagement") as ContentObjective,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("POST viral/optimize-hook:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao otimizar hook" },
      { status: 500 },
    )
  }
}

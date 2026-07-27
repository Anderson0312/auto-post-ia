import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/session"
import { ViralEngineService } from "@/lib/viral-engine/viral-engine-service"
import type { ContentObjective } from "@/lib/types/video-platform"

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await request.json()
    const brief = await ViralEngineService.buildGuidedBrief({
      answers: body.answers || {},
      platform: body.platform || "instagram",
      objective: (body.objective || "engagement") as ContentObjective,
    })

    return NextResponse.json({ brief })
  } catch (error) {
    console.error("POST viral/guided-brief:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro no assistente guiado" },
      { status: 500 },
    )
  }
}

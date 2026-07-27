import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/session"
import { ViralEngineService } from "@/lib/viral-engine/viral-engine-service"
import type { ContentObjective } from "@/lib/types/video-platform"

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await request.json()
    const ideas = await ViralEngineService.generateIdeas({
      niche: body.niche || body.prompt || "geral",
      platform: body.platform || "instagram",
      objective: (body.objective || "engagement") as ContentObjective,
      count: body.count,
      avatarName: body.avatarName,
    })

    return NextResponse.json({ ideas })
  } catch (error) {
    console.error("POST viral/ideas:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar ideias" },
      { status: 500 },
    )
  }
}

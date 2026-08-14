import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"
import type { ContentObjective } from "@/lib/types/video-platform"
import { GROWTH_OBJECTIVES } from "@/lib/growth/objectives"

const allowed = new Set(GROWTH_OBJECTIVES.map((o) => o.id))

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const config = await DatabaseService.getAIConfiguration(userId)
    const objective = (allowed.has(config?.post_objective) ? config.post_objective : "engagement") as ContentObjective
    return NextResponse.json({ objective })
  } catch {
    return NextResponse.json({ objective: "engagement" })
  }
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await request.json()
  const objective = body.objective as ContentObjective
  if (!allowed.has(objective)) {
    return NextResponse.json({ error: "Objetivo inválido" }, { status: 400 })
  }

  await DatabaseService.patchAIConfiguration(userId, { post_objective: objective })
  return NextResponse.json({ objective })
}

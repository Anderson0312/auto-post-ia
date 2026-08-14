import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/session"
import { VideoDatabaseService } from "@/lib/video-database"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const projects = await VideoDatabaseService.getProjects(userId)
    return NextResponse.json({ projects })
  } catch (error) {
    console.error("GET /api/projects:", error)
    return NextResponse.json({ error: "Erro ao listar projetos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await request.json()
    if (!body.title || !body.prompt) {
      return NextResponse.json({ error: "Título e prompt são obrigatórios" }, { status: 400 })
    }

    const project = await VideoDatabaseService.createProject(userId, {
      title: body.title,
      prompt: body.prompt,
      avatar_id: body.avatar_id,
      objective: body.objective || "engagement",
      target_platform: body.target_platform || "tiktok",
      duration_seconds: body.duration_seconds || 21,
      creation_mode: body.creation_mode || "free_prompt",
      config: body.config,
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error("POST /api/projects:", error)
    return NextResponse.json({ error: "Erro ao criar projeto" }, { status: 500 })
  }
}

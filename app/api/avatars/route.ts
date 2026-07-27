import { type NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { getUserIdFromRequest } from "@/lib/session"
import { AvatarService } from "@/lib/avatars/avatar-service"
import { VideoDatabaseService } from "@/lib/video-database"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const avatars = await VideoDatabaseService.getAvatars(userId)
    return NextResponse.json({ avatars })
  } catch (error) {
    console.error("GET /api/avatars:", error)
    return NextResponse.json({ error: "Erro ao listar avatares" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await request.json()
    if (!body.name || !body.description) {
      return NextResponse.json({ error: "Nome e descrição são obrigatórios" }, { status: 400 })
    }

    const avatar = await AvatarService.createFromDescription(userId, body)
    return NextResponse.json({ avatar, message: "Avatar em processamento" }, { status: 201 })
  } catch (error) {
    console.error("POST /api/avatars:", error)
    return NextResponse.json({ error: "Erro ao criar avatar" }, { status: 500 })
  }
}

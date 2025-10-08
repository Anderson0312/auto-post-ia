import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar temas do usuário
    const themes = await DatabaseService.getAIThemes(userId)

    return NextResponse.json({ themes })
  } catch (error) {
    console.error("Error fetching AI themes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    const body = await request.json()

    const { name, description } = body

    // Validações
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Nome do tema é obrigatório" }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({ error: "Nome do tema deve ter no máximo 100 caracteres" }, { status: 400 })
    }

    // Verificar se o tema já existe para este usuário
    const existingThemes = await DatabaseService.getAIThemes(userId)
    const themeExists = existingThemes.some((theme) => theme.name.toLowerCase() === name.trim().toLowerCase())

    if (themeExists) {
      return NextResponse.json({ error: "Tema já existe" }, { status: 400 })
    }

    // Criar novo tema
    const themeData = {
      user_id: userId,
      name: name.trim(),
      description: description?.trim() || "",
    }

    const newTheme = await DatabaseService.createAITheme(themeData)

    return NextResponse.json({
      theme: newTheme,
      message: "Tema criado com sucesso",
    })
  } catch (error) {
    console.error("Error creating AI theme:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

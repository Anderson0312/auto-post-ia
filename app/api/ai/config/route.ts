import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { verifyToken } from "@/lib/jwt"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const userId = payload.userId

    // Buscar configuração da IA do usuário
    let config
    try {
      config = await DatabaseService.getAIConfiguration(userId)
    } catch (error) {
      // Se não existe configuração, criar uma padrão
      config = {
        user_id: userId,
        themes: ["Produtividade e organização", "Marketing digital", "Empreendedorismo"],
        posts_per_day: 2,
        post_times: ["09:00", "15:00"],
        content_style: "professional",
        generate_images: true,
        post_objective: "engagement",
        custom_instructions: "",
        language: "pt-BR",
        post_format: "medium",
        is_active: true,
      }

      // Salvar configuração padrão
      config = await DatabaseService.updateAIConfiguration(userId, config)
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error fetching AI config:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const userId = payload.userId
    const body = await request.json()

    // Validar dados recebidos
    const {
      themes,
      posts_per_day,
      post_times,
      content_style,
      generate_images,
      post_objective,
      custom_instructions,
      language = "pt-BR",
      post_format = "medium",
    } = body

    // Validações básicas
    if (!Array.isArray(themes) || themes.length === 0) {
      return NextResponse.json({ error: "Pelo menos um tema deve ser fornecido" }, { status: 400 })
    }

    if (!posts_per_day || posts_per_day < 1 || posts_per_day > 5) {
      return NextResponse.json({ error: "Posts por dia deve estar entre 1 e 5" }, { status: 400 })
    }

    if (!Array.isArray(post_times) || post_times.length === 0) {
      return NextResponse.json({ error: "Pelo menos um horário deve ser fornecido" }, { status: 400 })
    }

    const validStyles = ["professional", "casual", "friendly", "authoritative", "inspirational"]
    if (!validStyles.includes(content_style)) {
      return NextResponse.json({ error: "Estilo de conteúdo inválido" }, { status: 400 })
    }

    const validObjectives = ["engagement", "awareness", "sales"]
    if (!validObjectives.includes(post_objective)) {
      return NextResponse.json({ error: "Objetivo do post inválido" }, { status: 400 })
    }

    // Atualizar configuração
    const configData = {
      themes,
      posts_per_day,
      post_times,
      content_style,
      generate_images: Boolean(generate_images),
      post_objective,
      custom_instructions: custom_instructions || "",
      language,
      post_format,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    const updatedConfig = await DatabaseService.updateAIConfiguration(userId, configData)

    return NextResponse.json({
      config: updatedConfig,
      message: "Configuração salva com sucesso",
    })
  } catch (error) {
    console.error("Error updating AI config:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

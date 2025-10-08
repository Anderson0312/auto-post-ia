import { type NextRequest, NextResponse } from "next/server"
import { AIService, type PostGenerationRequest } from "@/lib/ai-service"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    const body = await request.json()

    const { themes, platform, customInstructions, generateImage = false } = body

    // Validações
    if (!themes || !Array.isArray(themes) || themes.length === 0) {
      return NextResponse.json({ error: "Pelo menos um tema deve ser fornecido" }, { status: 400 })
    }

    if (!platform) {
      return NextResponse.json({ error: "Plataforma é obrigatória" }, { status: 400 })
    }

    // Buscar configuração da IA do usuário
    let aiConfig
    try {
      aiConfig = await DatabaseService.getAIConfiguration(userId)
    } catch (error) {
      return NextResponse.json({ error: "Configuração da IA não encontrada. Configure primeiro." }, { status: 400 })
    }

    // Verificar limites de uso (exemplo: usuários free têm limite)
    const usage = await DatabaseService.getUserUsage(userId)
    const user = await DatabaseService.getUserById(userId)

    if (user.plan_type === "free" && usage.ai_generations >= 10) {
      return NextResponse.json(
        { error: "Limite de gerações de IA atingido. Faça upgrade do seu plano." },
        { status: 403 },
      )
    }

    // Preparar dados para geração
    const generationRequest: PostGenerationRequest = {
      themes,
      objective: aiConfig.post_objective,
      contentStyle: aiConfig.content_style,
      platform,
      customInstructions: customInstructions || aiConfig.custom_instructions,
      language: aiConfig.language || "pt-BR",
      postFormat: aiConfig.post_format || "medium",
    }

    // Gerar post com IA
    const generatedPost = await AIService.generatePost(generationRequest)

    // Gerar imagem se solicitado
    let imageUrl = null
    if (generateImage && generatedPost.imagePrompt) {
      try {
        imageUrl = await AIService.generateImage(generatedPost.imagePrompt)
      } catch (error) {
        console.warn("Failed to generate image:", error)
        // Continuar sem imagem se falhar
      }
    }

    // Atualizar contador de uso
    await DatabaseService.updateUsageTracking(userId, "ai_generations")

    return NextResponse.json({
      post: {
        ...generatedPost,
        imageUrl,
      },
      message: "Post gerado com sucesso",
    })
  } catch (error) {
    console.error("Error generating post:", error)
    return NextResponse.json({ error: "Erro ao gerar post com IA" }, { status: 500 })
  }
}

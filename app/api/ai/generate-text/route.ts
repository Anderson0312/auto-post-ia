import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    const { prompt, max_tokens = 500 } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt é obrigatório" }, { status: 400 })
    }

    // Gerar texto com IA
    const result = await generateText({
      model: openai("gpt-4o"),
      prompt,
      maxTokens: max_tokens,
    })

    // Atualizar contador de uso
    await DatabaseService.updateUsageTracking(userId, "ai_generations")

    return NextResponse.json({
      text: result.text,
      message: "Texto gerado com sucesso",
    })
  } catch (error) {
    console.error("Error generating text:", error)
    return NextResponse.json({ error: "Erro ao gerar texto com IA" }, { status: 500 })
  }
}
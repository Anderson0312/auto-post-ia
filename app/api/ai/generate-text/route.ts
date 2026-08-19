import { NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"
import { llmGenerateText } from "@/lib/llm"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt é obrigatório" }, { status: 400 })
    }

    // Gerar texto com IA
    const text = await llmGenerateText(prompt)

    // Atualizar contador de uso
    await DatabaseService.updateUsageTracking(userId, "ai_generations")

    return NextResponse.json({
      text,
      message: "Texto gerado com sucesso",
    })
  } catch (error) {
    console.error("Error generating text:", error)
    return NextResponse.json({ error: "Erro ao gerar texto com IA" }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { verifyToken } from "@/lib/jwt"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const userId = payload.userId
    const { id: themeId } = await params

    if (!themeId) {
      return NextResponse.json({ error: "ID do tema é obrigatório" }, { status: 400 })
    }

    // Verificar se o tema pertence ao usuário
    const themes = await DatabaseService.getAIThemes(userId)
    const themeExists = themes.find((theme) => theme.id === themeId)

    if (!themeExists) {
      return NextResponse.json({ error: "Tema não encontrado" }, { status: 404 })
    }

    // Deletar tema (soft delete)
    await DatabaseService.deleteAITheme(themeId)

    return NextResponse.json({
      message: "Tema removido com sucesso",
    })
  } catch (error) {
    console.error("Error deleting AI theme:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

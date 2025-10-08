import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { getUserIdFromRequest } from "@/lib/session"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
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

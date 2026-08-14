import { NextResponse } from "next/server"
import { getGeminiAccountStatus } from "@/lib/providers/gemini-account"
import { getKlingAccountStatus } from "@/lib/providers/kling-account"
import { getUserIdFromRequest } from "@/lib/session"

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const [kling, gemini] = await Promise.all([getKlingAccountStatus(), getGeminiAccountStatus()])
  const canGenerateVideo = kling.canGenerateVideo || gemini.canGenerateVideo

  return NextResponse.json({
    canGenerateVideo,
    primary: kling.canGenerateVideo ? "kling" : gemini.canGenerateVideo ? "gemini" : null,
    kling,
    gemini,
    message: canGenerateVideo
      ? "Pelo menos um provider de vídeo está pronto."
      : "Nenhum provider de vídeo tem créditos/billing. Kling precisa de pacote API; Gemini Veo precisa de billing no AI Studio.",
  })
}

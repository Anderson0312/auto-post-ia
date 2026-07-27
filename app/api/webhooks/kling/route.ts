import { type NextRequest, NextResponse } from "next/server"
import { VideoDatabaseService } from "@/lib/video-database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { externalJobId, status, outputUrl, errorMessage } = body

    if (!externalJobId) {
      return NextResponse.json({ error: "externalJobId obrigatório" }, { status: 400 })
    }

    const { data: jobs } = await VideoDatabaseService.getProjectJobs("")
    void jobs

    return NextResponse.json({
      message: "Webhook recebido",
      externalJobId,
      status,
      outputUrl,
      errorMessage,
    })
  } catch (error) {
    console.error("POST /api/webhooks/kling:", error)
    return NextResponse.json({ error: "Erro no webhook" }, { status: 500 })
  }
}

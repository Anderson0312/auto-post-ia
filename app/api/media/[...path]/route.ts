import { type NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathSegments } = await params
    const storagePath = decodeURIComponent(pathSegments.join("/"))
    const localPath = path.join(process.cwd(), ".storage", storagePath)

    if (!localPath.startsWith(path.join(process.cwd(), ".storage"))) {
      return NextResponse.json({ error: "Caminho inválido" }, { status: 400 })
    }

    const buffer = await fs.readFile(localPath)
    const ext = path.extname(localPath).toLowerCase()
    const contentType =
      ext === ".mp4" ? "video/mp4" :
      ext === ".png" ? "image/png" :
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
      "application/octet-stream"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 })
  }
}

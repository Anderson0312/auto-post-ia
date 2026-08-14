import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/session"
import { ViralEngineService } from "@/lib/viral-engine/viral-engine-service"
import type { ContentObjective } from "@/lib/types/video-platform"

function youtubeKey() {
  return process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_YOUTUBE_API_KEY || ""
}

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const objective = (request.nextUrl.searchParams.get("objective") || "engagement") as ContentObjective
  const region = request.nextUrl.searchParams.get("region") || "BR"
  const niche = request.nextUrl.searchParams.get("niche") || "vídeos curtos Brasil"

  const youtube: Array<{
    id: string
    title: string
    thumbnail?: string
    channel?: string
    why: string
  }> = []

  const key = youtubeKey()
  if (key) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${encodeURIComponent(region)}&maxResults=12&videoCategoryId=24&key=${key}`,
      )
      const json = await res.json()
      for (const item of json.items || []) {
        youtube.push({
          id: item.id,
          title: item.snippet?.title,
          thumbnail: item.snippet?.thumbnails?.medium?.url,
          channel: item.snippet?.channelTitle,
          why: "Em alta no YouTube nesta região. Use só o formato e o gancho — não o vídeo original.",
        })
      }
    } catch {
      /* ignore */
    }
  }

  const formats = await ViralEngineService.getTrendingTopics({
    niche,
    platform: "tiktok",
    objective,
    count: 8,
  })

  return NextResponse.json({
    youtube,
    formats,
    objective,
    note: youtube.length
      ? "YouTube popular + formatos IA. Sem API oficial de trends do TikTok."
      : "Sem chave YouTube Data API. Mostrando formatos em alta gerados por IA.",
  })
}

import { type NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/session"
import { parseChannelUrl } from "@/lib/growth/parse-url"
import { ViralEngineService } from "@/lib/viral-engine/viral-engine-service"
import type { ContentObjective } from "@/lib/types/video-platform"

function youtubeKey() {
  return process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_YOUTUBE_API_KEY || ""
}

async function youtubeChannelContext(parsed: ReturnType<typeof parseChannelUrl>) {
  const key = youtubeKey()
  if (!key) return { title: parsed.handle || "Canal YouTube", context: "Sem YouTube Data API; use o handle e o estilo público." }

  let channelId = parsed.handle
  if (parsed.handle && !parsed.handle.startsWith("UC")) {
    const search = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(parsed.handle)}&key=${key}`,
    )
    const json = await search.json()
    channelId = json.items?.[0]?.snippet?.channelId || json.items?.[0]?.id?.channelId
  }

  if (parsed.videoId && parsed.videoId.length >= 8) {
    const v = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(parsed.videoId)}&key=${key}`,
    )
    const vj = await v.json()
    const sn = vj.items?.[0]?.snippet
    if (sn) {
      return {
        title: sn.channelTitle || "YouTube",
        context: `Título recente: ${sn.title}. Descrição: ${(sn.description || "").slice(0, 400)}`,
      }
    }
  }

  if (!channelId) return { title: parsed.handle || "YouTube", context: "Canal informado pelo usuário." }

  const searchVids = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}&order=date&maxResults=8&type=video&key=${key}`,
  )
  const sj = await searchVids.json()
  const titles = (sj.items || []).map((i: any) => i.snippet?.title).filter(Boolean).join(" | ")
  const chTitle = sj.items?.[0]?.snippet?.channelTitle || parsed.handle
  return { title: chTitle, context: `Últimos shorts/vídeos (títulos apenas, sem copiar o vídeo): ${titles}` }
}

async function tiktokContext(url: string, handle?: string) {
  try {
    const oembed = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
    if (oembed.ok) {
      const data = await oembed.json()
      return {
        title: data.author_name || handle || "TikTok",
        context: `Título/caption pública: ${data.title}. Autor: ${data.author_name}. Copie só o formato.`,
      }
    }
  } catch {
    /* ignore */
  }
  return { title: handle || "TikTok", context: `Canal @${handle || "creator"}. Extraia padrões de hook e CTA típicos do nicho, sem copiar vídeos.` }
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await request.json()
  const parsed = parseChannelUrl(String(body.url || ""))
  if (parsed.platform === "unknown") {
    return NextResponse.json({ error: "Cole uma URL de TikTok ou YouTube" }, { status: 400 })
  }

  const objective = (body.objective || "engagement") as ContentObjective
  const meta =
    parsed.platform === "youtube" ? await youtubeChannelContext(parsed) : await tiktokContext(parsed.url, parsed.handle)

  const ideas = await ViralEngineService.generateChannelStyleIdeas({
    channelLabel: meta.title,
    context: meta.context,
    objective,
    count: 10,
  })

  return NextResponse.json({
    platform: parsed.platform,
    channel: meta.title,
    url: parsed.url,
    notice: "Geramos ideias no estilo do canal. O vídeo original não é copiado.",
    ideas,
  })
}

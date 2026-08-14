export type ChannelPlatform = "youtube" | "tiktok" | "unknown"

export function parseChannelUrl(raw: string): { platform: ChannelPlatform; url: string; handle?: string; videoId?: string } {
  const url = raw.trim()
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`)
    const host = parsed.hostname.replace("www.", "")

    if (host.includes("youtu")) {
      const handle = parsed.pathname.match(/@([^/]+)/)?.[1]
      const channelId = parsed.pathname.match(/channel\/([^/]+)/)?.[1]
      const videoId = parsed.searchParams.get("v") || parsed.pathname.match(/\/shorts\/([^/]+)/)?.[1] || parsed.pathname.slice(1)
      return { platform: "youtube", url: parsed.toString(), handle: handle || channelId, videoId: videoId || undefined }
    }

    if (host.includes("tiktok.com")) {
      const handle = parsed.pathname.match(/@([^/]+)/)?.[1]
      return { platform: "tiktok", url: parsed.toString(), handle }
    }
  } catch {
    if (raw.startsWith("@")) return { platform: "tiktok", url: `https://www.tiktok.com/${raw}`, handle: raw.slice(1) }
  }

  return { platform: "unknown", url }
}

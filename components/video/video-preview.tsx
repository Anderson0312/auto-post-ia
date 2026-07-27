"use client"

export function VideoPreview({ url, poster }: { url?: string | null; poster?: string | null }) {
  if (!url) {
    return (
      <div className="aspect-[9/16] max-w-sm rounded-lg border bg-muted flex items-center justify-center text-sm text-muted-foreground">
        Vídeo ainda não disponível
      </div>
    )
  }

  if (url.match(/\.(png|jpg|jpeg|webp)(\?|$)/i)) {
    return <img src={url} alt="Preview" className="aspect-[9/16] max-w-sm rounded-lg object-cover border" />
  }

  return (
    <video
      src={url}
      poster={poster || undefined}
      controls
      className="aspect-[9/16] max-w-sm rounded-lg border bg-black"
    />
  )
}

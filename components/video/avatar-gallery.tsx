"use client"

import type { AvatarAsset } from "@/lib/types/video-platform"

export function AvatarGallery({ assets }: { assets: AvatarAsset[] }) {
  if (!assets?.length) {
    return <p className="text-sm text-muted-foreground">Nenhuma imagem na galeria.</p>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {assets.map((asset) => (
        <div key={asset.id} className="space-y-2">
          {asset.public_url && (
            <img
              src={asset.public_url}
              alt={asset.asset_type}
              className="rounded-lg w-full aspect-[9/16] object-cover border"
            />
          )}
          <p className="text-xs text-muted-foreground capitalize">{asset.asset_type}</p>
        </div>
      ))}
    </div>
  )
}

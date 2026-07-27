"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ProjectScene } from "@/lib/types/video-platform"

export function SceneCard({ scene }: { scene: ProjectScene }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Cena {scene.scene_order + 1}: {scene.title || "Sem título"}
          </CardTitle>
          <Badge variant="outline">{scene.provider || "—"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{scene.description}</p>
        {scene.image_url && (
          <img src={scene.image_url} alt={scene.title} className="rounded-lg w-full max-h-48 object-cover" />
        )}
        {scene.video_url && scene.video_url !== scene.image_url && (
          <video src={scene.video_url} controls className="rounded-lg w-full max-h-64" />
        )}
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{scene.duration_seconds}s</span>
          <span>•</span>
          <span>{scene.status}</span>
        </div>
      </CardContent>
    </Card>
  )
}

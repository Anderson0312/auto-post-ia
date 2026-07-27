"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Mic, Subtitles } from "lucide-react"

interface ProjectPostProductionProps {
  scriptReady: boolean
  narration?: { url?: string; voice?: string } | null
  subtitles?: { srtUrl?: string; vttUrl?: string; cueCount?: number } | null
  actionLoading: string | null
  onNarration: () => void
  onSubtitles: () => void
  onExport: () => void
}

export function ProjectPostProduction({
  scriptReady,
  narration,
  subtitles,
  actionLoading,
  onNarration,
  onSubtitles,
  onExport,
}: ProjectPostProductionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pós-produção (Fase 2)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!scriptReady || !!actionLoading}
            onClick={onNarration}
          >
            <Mic className="h-4 w-4 mr-2" />
            {actionLoading === "narration" ? "Gerando..." : "Gerar narração"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!scriptReady || !!actionLoading}
            onClick={onSubtitles}
          >
            <Subtitles className="h-4 w-4 mr-2" />
            {actionLoading === "subtitles" ? "Gerando..." : "Gerar legendas"}
          </Button>
          <Button variant="outline" size="sm" disabled={!!actionLoading} onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            {actionLoading === "export" ? "Exportando..." : "Exportar pacote"}
          </Button>
        </div>

        {narration?.url && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Narração ({narration.voice || "voz padrão"})</p>
            <audio controls src={narration.url} className="w-full" />
          </div>
        )}

        {subtitles && (
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">
              Legendas: {subtitles.cueCount || 0} cues
            </p>
            <div className="flex flex-wrap gap-2">
              {subtitles.srtUrl && (
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <a href={subtitles.srtUrl} download target="_blank" rel="noreferrer">Baixar SRT</a>
                </Button>
              )}
              {subtitles.vttUrl && (
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <a href={subtitles.vttUrl} download target="_blank" rel="noreferrer">Baixar VTT</a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

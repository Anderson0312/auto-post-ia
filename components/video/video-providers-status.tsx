"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"

export function VideoProvidersStatus() {
  const [status, setStatus] = useState<{
    canGenerateVideo: boolean
    message: string
    kling?: { canGenerateVideo: boolean; message: string }
    gemini?: { canGenerateVideo: boolean; message: string }
  } | null>(null)

  useEffect(() => {
    apiClient
      .getVideoProvidersStatus()
      .then(setStatus)
      .catch(() => {
        setStatus({
          canGenerateVideo: false,
          message: "Não foi possível checar Kling/Gemini. Confirme se está logado.",
        })
      })
  }, [])

  if (!status) return null

  return (
    <Card className={status.canGenerateVideo ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
      <CardContent className="py-3 text-sm space-y-1">
        <p className="font-medium">
          {status.canGenerateVideo ? "Geração de vídeo pronta" : "Vídeo bloqueado por créditos"}
        </p>
        <p className="text-muted-foreground">{status.message}</p>
        {status.kling && (
          <p className="text-xs text-muted-foreground">Kling: {status.kling.message}</p>
        )}
        {status.gemini && (
          <p className="text-xs text-muted-foreground">Gemini Veo: {status.gemini.message}</p>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { Sparkles } from "lucide-react"

interface ViralIdea {
  title: string
  hook: string
  angle: string
  format: string
  cta: string
  viralScore: number
  whyItWorks: string
}

export function ViralIdeasPanel({
  niche,
  platform,
  objective,
  avatarName,
  onSelect,
}: {
  niche: string
  platform: string
  objective: string
  avatarName?: string
  onSelect?: (idea: ViralIdea) => void
}) {
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<ViralIdea[]>([])

  const generate = async () => {
    if (!niche.trim()) return
    setLoading(true)
    try {
      const { ideas: result } = await apiClient.generateViralIdeas({
        niche,
        platform,
        objective,
        avatarName,
        count: 8,
      })
      setIdeas(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Viral Engine — ideias
        </CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={generate} disabled={loading || !niche.trim()}>
          {loading ? "Gerando..." : "Gerar ideias"}
        </Button>
      </CardHeader>
      {ideas.length > 0 && (
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {ideas.map((idea, index) => (
            <div key={index} className="rounded-lg border p-3 space-y-1 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{idea.title}</p>
                <span className="text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                  {idea.viralScore}/10
                </span>
              </div>
              <p className="text-muted-foreground"><strong>Hook:</strong> {idea.hook}</p>
              <p className="text-xs text-muted-foreground">{idea.whyItWorks}</p>
              {onSelect && (
                <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => onSelect(idea)}>
                  Usar esta ideia
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}

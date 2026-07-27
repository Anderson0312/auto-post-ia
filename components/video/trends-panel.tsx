"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { TrendingUp } from "lucide-react"

interface TrendTopic {
  title: string
  format: string
  hook: string
  hashtags: string[]
  whyTrending: string
  difficulty: "easy" | "medium" | "hard"
}

const difficultyLabel = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
}

export function TrendsPanel({
  niche,
  platform,
  objective,
  onSelect,
}: {
  niche: string
  platform: string
  objective: string
  onSelect?: (trend: TrendTopic) => void
}) {
  const [loading, setLoading] = useState(false)
  const [trends, setTrends] = useState<TrendTopic[]>([])

  const fetchTrends = async () => {
    if (!niche.trim()) return
    setLoading(true)
    try {
      const { trends: result } = await apiClient.getTrendingTopics({
        niche,
        platform,
        objective,
        count: 8,
      })
      setTrends(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Modo tendências
        </CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={fetchTrends} disabled={loading || !niche.trim()}>
          {loading ? "Buscando..." : "Ver tendências"}
        </Button>
      </CardHeader>
      {trends.length > 0 && (
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {trends.map((trend, index) => (
            <div key={index} className="rounded-lg border p-3 space-y-1 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{trend.title}</p>
                <span className="text-xs rounded-full bg-blue-100 text-blue-800 px-2 py-0.5">
                  {difficultyLabel[trend.difficulty]}
                </span>
              </div>
              <p className="text-muted-foreground"><strong>Formato:</strong> {trend.format}</p>
              <p className="text-muted-foreground"><strong>Hook:</strong> {trend.hook}</p>
              {trend.hashtags?.length > 0 && (
                <p className="text-xs text-muted-foreground">{trend.hashtags.join(" ")}</p>
              )}
              <p className="text-xs text-muted-foreground">{trend.whyTrending}</p>
              {onSelect && (
                <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => onSelect(trend)}>
                  Usar tendência
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}

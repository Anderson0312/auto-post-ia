"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api-client"

export function GuidedBriefForm({
  platform,
  objective,
  onApply,
}: {
  platform: string
  objective: string
  onApply: (data: { title: string; prompt: string }) => void
}) {
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState({
    niche: "",
    audience: "",
    painPoint: "",
    desiredOutcome: "",
    tone: "",
  })

  const submit = async () => {
    setLoading(true)
    try {
      const { brief } = await apiClient.buildGuidedBrief({ answers, platform, objective })
      onApply({ title: brief.suggestedTitle, prompt: brief.suggestedPrompt })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assistente guiado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Nicho / tema</Label>
          <Input value={answers.niche} onChange={(e) => setAnswers({ ...answers, niche: e.target.value })} />
        </div>
        <div>
          <Label>Público-alvo</Label>
          <Input value={answers.audience} onChange={(e) => setAnswers({ ...answers, audience: e.target.value })} />
        </div>
        <div>
          <Label>Dor ou problema</Label>
          <Textarea rows={2} value={answers.painPoint} onChange={(e) => setAnswers({ ...answers, painPoint: e.target.value })} />
        </div>
        <div>
          <Label>Resultado desejado</Label>
          <Input value={answers.desiredOutcome} onChange={(e) => setAnswers({ ...answers, desiredOutcome: e.target.value })} />
        </div>
        <div>
          <Label>Tom de voz</Label>
          <Input value={answers.tone} onChange={(e) => setAnswers({ ...answers, tone: e.target.value })} placeholder="Ex: direto, motivacional, humorístico" />
        </div>
        <Button type="button" onClick={submit} disabled={loading || !answers.niche.trim()}>
          {loading ? "Montando briefing..." : "Gerar briefing"}
        </Button>
      </CardContent>
    </Card>
  )
}

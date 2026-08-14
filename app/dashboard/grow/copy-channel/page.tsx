"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

export default function CopyChannelPage() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState<number | null>(null)
  const [result, setResult] = useState<any>(null)
  const [objective, setObjective] = useState("engagement")

  useEffect(() => {
    apiClient.getGrowthObjective().then((r) => setObjective(r.objective)).catch(() => {})
  }, [])

  const analyze = async () => {
    setLoading(true)
    try {
      const data = await apiClient.analyzeChannel(url, objective)
      setResult(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não deu para ler o canal")
    } finally {
      setLoading(false)
    }
  }

  const createFrom = async (idea: any, index: number) => {
    setCreating(index)
    try {
      const { project } = await apiClient.createProject({
        title: idea.title,
        prompt: `${idea.hook}\n\nÂngulo: ${idea.angle}\nFormato: ${idea.format}\nCTA: ${idea.cta}`,
        objective,
        target_platform: "tiktok",
        duration_seconds: 21,
        config: {
          viralIdea: idea,
          source: { type: "channel", url: result.url, channel: result.channel, ideas: result.ideas },
        },
      })
      apiClient.generateProjectScript(project.id).catch(() => {})
      router.push(`/dashboard/projects/${project.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar")
    } finally {
      setCreating(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Copiar canal</h1>
        <p className="text-sm text-zinc-400">
          Cole um TikTok ou YouTube. Extraímos hooks e formatos. O vídeo original não é baixado nem clonado.
        </p>
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
          placeholder="https://www.tiktok.com/@conta ou YouTube"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          onClick={analyze}
          disabled={loading}
          className="rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white"
        >
          {loading ? "Lendo..." : "Analisar"}
        </button>
      </div>
      {result && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            {result.channel} · {result.notice}
          </p>
          {result.ideas?.map((idea: any, i: number) => (
            <div key={i} className="rounded-2xl border border-zinc-800 p-4">
              <p className="font-medium">{idea.title}</p>
              <p className="text-sm text-zinc-400">{idea.hook}</p>
              <p className="mt-1 text-xs text-fuchsia-400">Viral {idea.viralScore}/10</p>
              <button
                type="button"
                className="mt-3 rounded-full bg-zinc-100 px-4 py-1.5 text-sm text-zinc-900"
                disabled={creating !== null}
                onClick={() => createFrom(idea, i)}
              >
                {creating === i ? "Criando..." : "Gerar meu short"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

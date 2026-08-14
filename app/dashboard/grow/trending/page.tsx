"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

export default function TrendingPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const obj = await apiClient.getGrowthObjective().catch(() => ({ objective: "engagement" }))
        const trends = await apiClient.getWorldTrends(obj.objective)
        setData(trends)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao carregar tendências")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const useBase = async (title: string, prompt: string, extra: Record<string, unknown>, key: string) => {
    setCreating(key)
    try {
      const obj = await apiClient.getGrowthObjective().catch(() => ({ objective: "engagement" }))
      const { project } = await apiClient.createProject({
        title,
        prompt,
        objective: obj.objective,
        target_platform: "tiktok",
        duration_seconds: 21,
        config: { source: { type: "trend" }, ...extra },
      })
      apiClient.generateProjectScript(project.id).catch(() => {})
      router.push(`/dashboard/projects/${project.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar")
    } finally {
      setCreating(null)
    }
  }

  if (loading) return <p className="text-zinc-500">Buscando o que está em alta...</p>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Em alta</h1>
        <p className="text-sm text-zinc-400">{data?.note}</p>
      </div>

      {data?.youtube?.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium">YouTube popular</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.youtube.map((v: any) => (
              <div key={v.id} className="overflow-hidden rounded-2xl border border-zinc-800">
                {v.thumbnail && <img src={v.thumbnail} alt="" className="aspect-video w-full object-cover" />}
                <div className="p-4">
                  <p className="line-clamp-2 font-medium">{v.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{v.why}</p>
                  <button
                    type="button"
                    className="mt-3 text-sm text-fuchsia-400"
                    disabled={!!creating}
                    onClick={() =>
                      useBase(
                        v.title,
                        `Use só o formato e o gancho deste vídeo em alta. Não copie cenas nem áudio. Título de referência: ${v.title}`,
                        { trendsContext: v.title },
                        v.id,
                      )
                    }
                  >
                    {creating === v.id ? "Criando..." : "Usar esta base"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-medium">Formatos em alta (IA)</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(data?.formats || []).map((t: any, i: number) => (
            <div key={i} className="rounded-2xl border border-zinc-800 p-4">
              <p className="font-medium">{t.title}</p>
              <p className="text-sm text-zinc-400">{t.hook}</p>
              <p className="mt-1 text-xs text-zinc-500">{t.whyTrending} · {t.format}</p>
              <button
                type="button"
                className="mt-3 text-sm text-fuchsia-400"
                disabled={!!creating}
                onClick={() =>
                  useBase(t.title, `${t.hook}\n\nFormato: ${t.format}\nHashtags: ${(t.hashtags || []).join(" ")}`, { trends: [t] }, `f-${i}`)
                }
              >
                {creating === `f-${i}` ? "Criando..." : "Usar esta base"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

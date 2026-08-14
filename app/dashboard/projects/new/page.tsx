"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useAvatars } from "@/hooks/use-api"
import { GROWTH_OBJECTIVES } from "@/lib/growth/objectives"
import { DEFAULT_SHORT_DURATION, DEFAULT_SHORT_PLATFORM } from "@/lib/short-form"
import { toast } from "sonner"

export default function NewProjectPage() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
      <NewProjectForm />
    </Suspense>
  )
}

function NewProjectForm() {
  const router = useRouter()
  const search = useSearchParams()
  const { data: avatarsData } = useAvatars()
  const avatars = (avatarsData as any)?.avatars || []

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [ideasLoading, setIdeasLoading] = useState(false)
  const [ideas, setIdeas] = useState<any[]>([])
  const [form, setForm] = useState({
    idea: search.get("prompt") || "",
    title: search.get("title") || "",
    objective: "engagement",
    avatar_id: "none",
  })
  const [viralIdea, setViralIdea] = useState<any>(null)

  useEffect(() => {
    apiClient.getGrowthObjective().then((r) => {
      setForm((p) => ({ ...p, objective: r.objective || "engagement" }))
    }).catch(() => {})
  }, [])

  const loadIdeas = async () => {
    if (!form.idea.trim()) {
      toast.error("Escreva uma ideia")
      return
    }
    setIdeasLoading(true)
    try {
      const res = await apiClient.generateViralIdeas({
        niche: form.idea,
        platform: DEFAULT_SHORT_PLATFORM,
        objective: form.objective,
        count: 5,
      })
      setIdeas(res.ideas || [])
      setStep(2)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar ângulos")
    } finally {
      setIdeasLoading(false)
    }
  }

  const create = async (idea?: any) => {
    const selected = idea || viralIdea
    const title = selected?.title || form.title || form.idea.slice(0, 80)
    const prompt = selected
      ? `${selected.hook}\n\nÂngulo: ${selected.angle}\nFormato: ${selected.format}\nCTA: ${selected.cta}`
      : form.idea
    if (!title.trim() || !prompt.trim()) {
      toast.error("Escreva uma ideia para criar o short")
      return
    }
    setLoading(true)
    try {
      const { project } = await apiClient.createProject({
        title,
        prompt,
        avatar_id: form.avatar_id === "none" ? undefined : form.avatar_id,
        objective: form.objective,
        target_platform: DEFAULT_SHORT_PLATFORM,
        duration_seconds: DEFAULT_SHORT_DURATION,
        config: {
          viralIdea: selected || undefined,
          source: search.get("source")
            ? { type: search.get("source"), url: search.get("url") || undefined }
            : undefined,
        },
      })
      apiClient.generateProjectScript(project.id).catch(() => {})
      toast.success("Short criado. Roteiro a caminho.")
      router.push(`/dashboard/projects/${project.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo short</h1>
        <p className="text-sm text-zinc-400">Dois passos: objetivo + ideia. Um clique gera o roteiro.</p>
      </div>

      {step === 1 && (
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <label className="block text-sm text-zinc-400">
            Objetivo deste vídeo
            <select
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
            >
              {GROWTH_OBJECTIVES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label} — {o.hint}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-zinc-400">
            Ideia
            <textarea
              id="short-idea"
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
              rows={4}
              value={form.idea}
              onChange={(e) => setForm({ ...form, idea: e.target.value })}
              placeholder="Ex: 3 erros que travam o crescimento no TikTok"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Avatar (opcional)
            <select
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              value={form.avatar_id}
              onChange={(e) => setForm({ ...form, avatar_id: e.target.value })}
            >
              <option value="none">Nenhum</option>
              {avatars.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadIdeas}
              disabled={ideasLoading || !form.idea.trim()}
              className="rounded-full bg-fuchsia-500 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {ideasLoading ? "Gerando ângulos..." : "Gerar 5 ângulos"}
            </button>
            <button
              type="button"
              onClick={() => create()}
              disabled={loading || !form.idea.trim()}
              className="rounded-full border border-zinc-700 px-5 py-2 text-sm disabled:opacity-50"
            >
              Criar agora
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <button type="button" className="text-sm text-zinc-500" onClick={() => setStep(1)}>
            ← Voltar
          </button>
          {ideas.map((idea, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setViralIdea(idea)
                create(idea)
              }}
              disabled={loading}
              className="w-full rounded-2xl border border-zinc-800 p-4 text-left hover:border-fuchsia-500/60"
            >
              <p className="font-medium">{idea.title}</p>
              <p className="mt-1 text-sm text-zinc-400">{idea.hook}</p>
              <p className="mt-1 text-xs text-fuchsia-400">Score {idea.viralScore}/10 · {idea.format}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

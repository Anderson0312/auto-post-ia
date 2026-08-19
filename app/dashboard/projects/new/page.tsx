"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useAvatars } from "@/hooks/use-api"
import { GROWTH_OBJECTIVES, objectiveLabel } from "@/lib/growth/objectives"
import { DEFAULT_SHORT_PLATFORM } from "@/lib/short-form"
import {
  ADULT_AUDIENCES,
  DEFAULT_SHORT_PARAMS,
  SHORT_PARAM_FIELDS,
  buildShortPromptConfig,
  isAdultSensualCategory,
  isMinorAudience,
  parseAngleCount,
  parseDurationSeconds,
  shortUsesAvatar,
  type ShortEditableParams,
} from "@/lib/shorts/short-prompt-template"
import { toast } from "sonner"

const FIELD_SECTIONS: Array<{ title: string; keys: Array<keyof ShortEditableParams> }> = [
  { title: "Público e categoria", keys: ["publico_alvo", "categoria"] },
  { title: "Visual", keys: ["formato_visual", "estilo_visual"] },
  { title: "Tom e ritmo", keys: ["tom", "linguagem", "ritmo", "narracao"] },
  { title: "Entrega", keys: ["duracao", "quantidade_angulos", "cta"] },
]

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
  const [shortParams, setShortParams] = useState<ShortEditableParams>({ ...DEFAULT_SHORT_PARAMS })
  const [viralIdea, setViralIdea] = useState<any>(null)

  const needsAvatar = shortUsesAvatar(shortParams)
  const angleCount = parseAngleCount(shortParams.quantidade_angulos)
  const isSensual = isAdultSensualCategory(shortParams.categoria)
  const promptPreview = useMemo(() => buildShortPromptConfig(shortParams), [shortParams])
  const objective = GROWTH_OBJECTIVES.find((o) => o.id === form.objective)

  useEffect(() => {
    apiClient.getGrowthObjective().then((r) => {
      setForm((p) => ({ ...p, objective: r.objective || "engagement" }))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isAdultSensualCategory(shortParams.categoria)) return
    setShortParams((prev) => {
      const next = { ...prev }
      let changed = false
      if (isMinorAudience(next.publico_alvo) || next.publico_alvo === "todos os públicos") {
        next.publico_alvo = "adulto"
        changed = true
      }
      if (next.linguagem === "adequada para crianças") {
        next.linguagem = "adulta e direta"
        changed = true
      }
      if (next.tom === "educativo e leve") {
        next.tom = "sensual"
        changed = true
      }
      if (!next.estilo_visual.includes("sensual")) {
        next.estilo_visual = "sensual cinematográfico"
        changed = true
      }
      return changed ? next : prev
    })
  }, [shortParams.categoria])

  const updateParam = (key: keyof ShortEditableParams, value: string) => {
    setShortParams((prev) => ({ ...prev, [key]: value }))
  }

  const goToIdeas = async () => {
    if (needsAvatar && form.avatar_id === "none") {
      toast.error("Este formato precisa de um avatar")
      return
    }
    setStep(2)
    await loadIdeas()
  }

  const loadIdeas = async () => {
    if (needsAvatar && form.avatar_id === "none") {
      toast.error("Este formato precisa de um avatar")
      return
    }
    setIdeasLoading(true)
    try {
      const selectedAvatar = avatars.find((a: any) => a.id === form.avatar_id)
      const res = await apiClient.generateViralIdeas({
        niche: form.idea.trim(),
        platform: DEFAULT_SHORT_PLATFORM,
        objective: form.objective,
        count: angleCount,
        avatarName: needsAvatar ? selectedAvatar?.name : undefined,
        shortParams,
      })
      setIdeas(res.ideas || [])
      if (!res.ideas?.length) toast.error("A IA não devolveu ideias. Tente de novo.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar ideias")
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
      toast.error("Gere ou escolha uma ideia para criar o short")
      return
    }
    if (needsAvatar && form.avatar_id === "none") {
      toast.error("Este formato precisa de um avatar")
      return
    }
    setLoading(true)
    try {
      const { project } = await apiClient.createProject({
        title,
        prompt,
        avatar_id: needsAvatar && form.avatar_id !== "none" ? form.avatar_id : undefined,
        objective: form.objective,
        target_platform: DEFAULT_SHORT_PLATFORM,
        duration_seconds: parseDurationSeconds(shortParams.duracao),
        config: {
          viralIdea: selected || undefined,
          shortParams,
          shortPrompt: promptPreview,
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

  const renderField = (key: keyof ShortEditableParams) => {
    const field = SHORT_PARAM_FIELDS.find((item) => item.key === key)
    if (!field) return null

    const options =
      key === "publico_alvo" && isSensual
        ? [...ADULT_AUDIENCES]
        : field.options || []

    return (
      <label key={key} className="block text-sm text-zinc-400">
        {field.label}
        <select
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
          value={shortParams[key]}
          onChange={(e) => updateParam(key, e.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold">Novo short</h1>
        <p className="text-sm text-zinc-400">
          {step === 1
            ? "1 de 2 — Defina objetivo e parâmetros. A ideia vem no próximo passo."
            : "2 de 2 — A IA gera ideias com base no objetivo e nos parâmetros."}
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <label className="block text-sm text-zinc-400">
            Objetivo principal
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

          {isSensual && (
            <p className="rounded-md border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2 text-xs text-fuchsia-200">
              Categoria +18 sensual: shorts para adultos com clima de sedução. Sem sexo explícito.
              Público travado em jovem adulto/adulto.
            </p>
          )}

          {FIELD_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{section.title}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {section.keys.map((key) => renderField(key))}
              </div>
            </div>
          ))}

          {needsAvatar ? (
            <label className="block text-sm text-zinc-400">
              Avatar
              <select
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
                value={form.avatar_id}
                onChange={(e) => setForm({ ...form, avatar_id: e.target.value })}
              >
                <option value="none">Selecione um avatar</option>
                {avatars.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-500">
              Este formato gera cenas, analogias ou animação do tema — sem apresentador na câmera.
            </p>
          )}

          <button
            type="button"
            onClick={goToIdeas}
            disabled={ideasLoading}
            className="rounded-full bg-fuchsia-500 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Continuar para ideias
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <button type="button" className="text-sm text-zinc-500" onClick={() => setStep(1)}>
            ← Voltar aos parâmetros
          </button>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-zinc-200">Gerador de ideias</p>
              <p className="mt-1 text-xs text-zinc-500">
                A IA usa o objetivo <span className="text-fuchsia-300">{objectiveLabel(form.objective)}</span>
                {objective ? ` (${objective.hint})` : ""} e os parâmetros que você cadastrou.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {[
                shortParams.publico_alvo,
                shortParams.categoria,
                shortParams.formato_visual,
                shortParams.tom,
                shortParams.duracao,
              ].map((chip) => (
                <span key={chip} className="rounded-full border border-zinc-700 px-2.5 py-1 text-zinc-300">
                  {chip}
                </span>
              ))}
            </div>

            <label className="block text-sm text-zinc-400">
              Tema ou dica (opcional)
              <textarea
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                rows={3}
                value={form.idea}
                onChange={(e) => setForm({ ...form, idea: e.target.value })}
                placeholder="Deixe em branco para a IA inventar. Ou dê um tema, produto, nome, etc."
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadIdeas}
                disabled={ideasLoading}
                className="rounded-full bg-fuchsia-500 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {ideasLoading
                  ? "Gerando ideias..."
                  : ideas.length
                    ? `Gerar de novo (${angleCount})`
                    : `Gerar ${angleCount} ideia${angleCount === 1 ? "" : "s"} com IA`}
              </button>
              <button
                type="button"
                onClick={() => create()}
                disabled={loading || !form.idea.trim()}
                className="rounded-full border border-zinc-700 px-5 py-2 text-sm disabled:opacity-50"
              >
                Usar o texto acima
              </button>
            </div>
          </div>

          {ideasLoading && !ideas.length && (
            <p className="text-sm text-zinc-500">Gerando ideias com os parâmetros cadastrados...</p>
          )}

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
              {idea.whyItWorks && (
                <p className="mt-1 text-xs text-zinc-500">{idea.whyItWorks}</p>
              )}
              <p className="mt-1 text-xs text-fuchsia-400">Score {idea.viralScore}/10 · {idea.format}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

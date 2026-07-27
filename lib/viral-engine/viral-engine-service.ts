import { generateObject, generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import type { ContentObjective } from "@/lib/types/video-platform"
import type { GuidedBrief, HookOptimization, TrendTopic, ViralIdea } from "@/lib/viral-engine/types"

const IdeasSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string(),
      hook: z.string(),
      angle: z.string(),
      format: z.string(),
      cta: z.string(),
      viralScore: z.number().min(1).max(10),
      whyItWorks: z.string(),
    }),
  ),
})

const GuidedBriefSchema = z.object({
  niche: z.string(),
  audience: z.string(),
  painPoint: z.string(),
  desiredOutcome: z.string(),
  tone: z.string(),
  suggestedPrompt: z.string(),
  suggestedTitle: z.string(),
})

const TrendsSchema = z.object({
  trends: z.array(
    z.object({
      title: z.string(),
      format: z.string(),
      hook: z.string(),
      hashtags: z.array(z.string()),
      whyTrending: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
    }),
  ),
})

const HookSchema = z.object({
  improvedHook: z.string(),
  alternatives: z.array(z.string()),
  captionSuggestions: z.array(z.string()),
  tips: z.array(z.string()),
})

const platformGuidelines: Record<string, string> = {
  instagram: "Reels: hook em 1s, legendas curtas, CTA nos comentários ou DM",
  tiktok: "TikTok: linguagem casual, trend-friendly, loop visual, texto na tela",
  youtube: "Shorts: título forte, retenção nos primeiros 3s, CTA de inscrição",
  facebook: "Reels Facebook: tom acessível, compartilhável, perguntas no final",
  kwai: "Kwai: entretenimento rápido, emoção alta, formato vertical",
}

const objectiveGuidelines: Record<string, string> = {
  views: "Maximizar retenção e compartilhamentos",
  followers: "Posicionar autoridade e convidar a seguir",
  engagement: "Perguntas, polêmica leve, comentários",
  sales: "Prova social, urgência sutil, CTA de compra",
  leads: "Lead magnet, CTA para DM ou link na bio",
  branding: "Consistência de marca, tom profissional",
  education: "Valor prático rápido, listas e frameworks",
  motivation: "História pessoal, transformação, energia alta",
  entertainment: "Humor, surpresa, formato leve",
  institutional: "Credibilidade, bastidores, confiança",
}

export class ViralEngineService {
  static async generateIdeas(params: {
    niche: string
    platform: string
    objective: ContentObjective
    count?: number
    avatarName?: string
  }): Promise<ViralIdea[]> {
    const count = Math.min(params.count || 10, 20)
    const prompt = `
Você é um estrategista de conteúdo viral para vídeos curtos.

Nicho: ${params.niche}
Plataforma: ${params.platform} — ${platformGuidelines[params.platform] || "vídeo vertical curto"}
Objetivo: ${params.objective} — ${objectiveGuidelines[params.objective] || "engajamento"}
${params.avatarName ? `Avatar/personagem: ${params.avatarName}` : ""}

Gere ${count} ideias de vídeo com alto potencial viral.
Cada ideia deve ter hook forte (primeiros 3 segundos), ângulo único e CTA claro.
Idioma: pt-BR.
`

    try {
      const result = await generateObject({
        model: openai("gpt-4o"),
        prompt,
        schema: IdeasSchema,
      })
      return result.object.ideas
    } catch {
      const fallback = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt + "\nResponda em JSON válido com array 'ideas'.",
      })
      const match = fallback.text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        return parsed.ideas || []
      }
      throw new Error("Falha ao gerar ideias virais")
    }
  }

  static async buildGuidedBrief(params: {
    answers: Record<string, string>
    platform: string
    objective: ContentObjective
  }): Promise<GuidedBrief> {
    const prompt = `
Com base nas respostas do usuário, monte um briefing para vídeo viral.

Respostas:
${JSON.stringify(params.answers, null, 2)}

Plataforma: ${params.platform}
Objetivo: ${params.objective}

Retorne um briefing estruturado com prompt sugerido pronto para gerar roteiro (2-4 frases, específico).
Idioma: pt-BR.
`

    try {
      const result = await generateObject({
        model: openai("gpt-4o"),
        prompt,
        schema: GuidedBriefSchema,
      })
      return {
        ...result.object,
        objective: params.objective,
        platform: params.platform,
      }
    } catch {
      throw new Error("Falha ao montar briefing guiado")
    }
  }

  static async getTrendingTopics(params: {
    niche: string
    platform: string
    objective: ContentObjective
    count?: number
  }): Promise<TrendTopic[]> {
    const count = Math.min(params.count || 8, 15)
    const prompt = `
Você é analista de tendências de vídeos curtos em ${new Date().getFullYear()}.

Nicho: ${params.niche}
Plataforma: ${params.platform}
Objetivo: ${params.objective} — ${objectiveGuidelines[params.objective] || ""}
Diretrizes: ${platformGuidelines[params.platform] || ""}

Sugira ${count} formatos/tendências aplicáveis AGORA para este nicho (estilo POV, antes/depois, mitos, storytelling, lista rápida, etc.).
Inclua hashtags relevantes em pt-BR/inglês conforme a plataforma.
Idioma do conteúdo: pt-BR.
`

    try {
      const result = await generateObject({
        model: openai("gpt-4o"),
        prompt,
        schema: TrendsSchema,
      })
      return result.object.trends
    } catch {
      throw new Error("Falha ao buscar tendências")
    }
  }

  static buildScriptContext(config?: Record<string, unknown>) {
    if (!config) return ""

    const parts: string[] = []
    const trends = config.trends as TrendTopic[] | undefined
    const viralIdea = config.viralIdea as ViralIdea | undefined
    const trendsContext = config.trendsContext as string | undefined

    if (trendsContext) parts.push(`Contexto de tendências: ${trendsContext}`)
    if (viralIdea) {
      parts.push(
        `Ideia viral selecionada — Hook: ${viralIdea.hook}. Ângulo: ${viralIdea.angle}. CTA: ${viralIdea.cta}.`,
      )
    }
    if (trends?.length) {
      const top = trends.slice(0, 3).map((t) => `${t.title} (${t.format})`).join("; ")
      parts.push(`Tendências a considerar: ${top}`)
    }

    return parts.join("\n")
  }

  static async optimizeHook(params: {
    hook: string
    fullScript?: string
    platform: string
    objective: ContentObjective
  }): Promise<HookOptimization> {
    const prompt = `
Otimize este hook para vídeo viral.

Hook atual: ${params.hook}
${params.fullScript ? `Roteiro completo:\n${params.fullScript}` : ""}
Plataforma: ${params.platform}
Objetivo: ${params.objective}

Melhore o hook para retenção nos primeiros 3 segundos.
Sugira 3 alternativas, legendas para a tela e dicas práticas.
Idioma: pt-BR.
`

    try {
      const result = await generateObject({
        model: openai("gpt-4o"),
        prompt,
        schema: HookSchema,
      })
      return {
        originalHook: params.hook,
        improvedHook: result.object.improvedHook,
        alternatives: result.object.alternatives,
        captionSuggestions: result.object.captionSuggestions,
        tips: result.object.tips,
      }
    } catch {
      throw new Error("Falha ao otimizar hook")
    }
  }
}

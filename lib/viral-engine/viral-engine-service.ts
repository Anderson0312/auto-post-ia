import { z } from "zod"
import type { ContentObjective } from "@/lib/types/video-platform"
import type { GuidedBrief, HookOptimization, TrendTopic, ViralIdea } from "@/lib/viral-engine/types"
import { llmGenerateObject, llmGenerateText } from "@/lib/llm"
import {
  buildShortPromptConfig,
  buildShortScriptContext,
  isAdultSensualCategory,
  parseAngleCount,
  type ShortEditableParams,
} from "@/lib/shorts/short-prompt-template"

const IdeasSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string(),
      hook: z.string(),
      angle: z.string(),
      format: z.string(),
      cta: z.string(),
      viralScore: z.coerce.number().min(1).max(10),
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
      hashtags: z.union([z.array(z.string()), z.string()]).transform((value) =>
        Array.isArray(value) ? value : value.split(/[\s,]+/).filter(Boolean),
      ),
      whyTrending: z.string(),
      difficulty: z
        .string()
        .transform((value) => {
          const normalized = value.toLowerCase()
          if (normalized.includes("easy") || normalized.includes("facil") || normalized.includes("fácil")) return "easy"
          if (normalized.includes("hard") || normalized.includes("dificil") || normalized.includes("difícil")) return "hard"
          return "medium"
        }),
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
    shortParams?: Partial<ShortEditableParams>
  }): Promise<ViralIdea[]> {
    const count = Math.min(params.count || parseAngleCount(params.shortParams?.quantidade_angulos), 20)
    const shortConfig = params.shortParams ? buildShortPromptConfig(params.shortParams) : null
    const p = shortConfig?.PARAMETROS_EDITAVEIS
    const userHint = params.niche?.trim() && params.niche.trim().toLowerCase() !== "geral"
      ? params.niche.trim()
      : ""
    const prompt = `
Você é um estrategista de conteúdo viral para vídeos curtos (TikTok / Shorts / Reels).

OBJETIVO PRINCIPAL DA CONTA/VÍDEO: ${params.objective} — ${objectiveGuidelines[params.objective] || "engajamento"}
Este objetivo é a prioridade número 1. Toda ideia deve servir a esse objetivo.

Plataforma: ${params.platform} — ${platformGuidelines[params.platform] || "vídeo vertical curto"}
${params.avatarName ? `Avatar/personagem: ${params.avatarName}` : ""}
${p ? `
PARÂMETROS CADASTRADOS PELO USUÁRIO (obrigatório respeitar TODOS):
- Público-alvo: ${p.publico_alvo}
- Categoria: ${p.categoria}
- Formato visual: ${p.formato_visual}
- Estilo: ${p.estilo_visual}
- Tom: ${p.tom}
- Linguagem: ${p.linguagem}
- Ritmo: ${p.ritmo}
- Narração: ${p.narracao}
- Duração: ${p.duracao}
- CTA: ${p.cta}
- Regra visual: ${shortConfig?.VISUAL.personagem}
- Cenas: ${shortConfig?.VISUAL.cenas}
${isAdultSensualCategory(p.categoria) ? `
Categoria +18 SENSUAL: ideias de shorts para adultos com tensão, charme, desejo sutil e visual atraente.
Toda pessoa mencionada deve ser adulta 18+.
SEM genitália, SEM pornografia, SEM menores.
Hooks visuais: olhar, corpo, lingerie, atmosfera íntima.
` : ""}
` : ""}
${userHint
  ? `Dica extra do usuário (usar como tema, sem ignorar os parâmetros): ${userHint}`
  : `O usuário NÃO escreveu uma ideia pronta. Invente ideias concretas, específicas e prontas para gravar usando SOMENTE o objetivo principal e os parâmetros cadastrados. Não peça mais informações.`}

Gere EXATAMENTE ${count} ideias de vídeo com alto potencial viral.
Cada ideia deve ter título, hook forte (primeiros 3 segundos), ângulo único, formato e CTA claro.
As ideias DEVEM respeitar o público-alvo, a categoria e o formato visual.
Idioma: pt-BR.
`

    try {
      const result = await llmGenerateObject(prompt, IdeasSchema)
      return result.ideas
    } catch {
      const fallback = await llmGenerateText(prompt + "\nResponda em JSON válido com array 'ideas'.")
      const match = fallback.match(/\{[\s\S]*\}/)
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
      const result = await llmGenerateObject(prompt, GuidedBriefSchema)
      return {
        ...result,
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
      const result = await llmGenerateObject(prompt, TrendsSchema)
      return result.trends as TrendTopic[]
    } catch (error) {
      console.error("getTrendingTopics:", error)
      throw new Error(error instanceof Error ? error.message : "Falha ao buscar tendências")
    }
  }

  static buildScriptContext(config?: Record<string, unknown>) {
    if (!config) return ""

    const parts: string[] = []
    const trends = config.trends as TrendTopic[] | undefined
    const viralIdea = config.viralIdea as ViralIdea | undefined
    const trendsContext = config.trendsContext as string | undefined
    const shortParams = (config.shortParams || config.PARAMETROS_EDITAVEIS) as
      | Partial<ShortEditableParams>
      | undefined

    if (trendsContext) parts.push(`Contexto de tendências: ${trendsContext}`)
    if (shortParams) {
      const shortConfig = buildShortPromptConfig(shortParams)
      parts.push(buildShortScriptContext(shortConfig))
    }
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
      const result = await llmGenerateObject(prompt, HookSchema)
      return {
        originalHook: params.hook,
        improvedHook: result.improvedHook,
        alternatives: result.alternatives,
        captionSuggestions: result.captionSuggestions,
        tips: result.tips,
      }
    } catch {
      throw new Error("Falha ao otimizar hook")
    }
  }

  static async generateChannelStyleIdeas(params: {
    channelLabel: string
    context: string
    objective: ContentObjective
    count?: number
  }): Promise<ViralIdea[]> {
    return this.generateIdeas({
      niche: `Estilo do canal ${params.channelLabel}. NÃO copie o vídeo original. Copie só formato, hook e estrutura. Contexto: ${params.context}`,
      platform: "tiktok",
      objective: params.objective,
      count: params.count || 10,
    })
  }
}

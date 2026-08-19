import { z } from "zod"
import { buildSceneVisualPrompt } from "@/lib/avatars/scene-prompt"
import {
  buildAvatarImagePrompt,
  buildAvatarPromptConfig,
  serializeAvatarPromptConfig,
} from "@/lib/avatars/selfie-prompt-template"
import { AIService } from "@/lib/ai-service"
import { llmGenerateObject, llmGenerateText } from "@/lib/llm"
import { SHORT_ASPECT_RATIO, SHORT_FORM_SCRIPT_RULES } from "@/lib/short-form"
import {
  buildShortPromptConfig,
  buildShortScriptBrief,
  buildShortStoryboardInstructions,
  isAdultSensualCategory,
  shortUsesAvatar,
  type ShortEditableParams,
} from "@/lib/shorts/short-prompt-template"
import type { AvatarIdentityInput, GeneratedAvatarIdentity, GeneratedScript, StoryboardScene } from "@/lib/providers/types"
import type { ContentObjective } from "@/lib/types/video-platform"

const AvatarIdentitySchema = z.object({
  masterPrompt: z.string(),
  personality: z.string(),
  visualStyle: z.string(),
  defaultClothing: z.string(),
  defaultExpressions: z.string(),
  imagePrompt: z.string(),
})

const ScriptSchema = z.object({
  hook: z.string(),
  body: z.string(),
  cta: z.string(),
  fullScript: z.string(),
  structure: z.object({
    scenes: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        durationSeconds: z.number(),
      }),
    ),
    captions: z.array(z.string()),
    pacing: z.string(),
  }),
})

export class OpenAIProvider {
  static async generateAvatarIdentity(input: AvatarIdentityInput): Promise<GeneratedAvatarIdentity> {
    if (input.avatarParams) {
      const config = buildAvatarPromptConfig(input.avatarParams)
      const params = config.PARAMETROS_EDITAVEIS
      const nicheSuffix = input.niche ? ` Conteúdo sobre ${input.niche}.` : ""

      return {
        masterPrompt: serializeAvatarPromptConfig(config),
        personality: input.personality || `${params.expressao}, carismática e autêntica.${nicheSuffix}`,
        visualStyle: "selfie fotorrealista com smartphone",
        defaultClothing: params.roupa,
        defaultExpressions: params.expressao,
        imagePrompt: buildAvatarImagePrompt(config),
      }
    }

    const prompt = `
Crie a identidade visual completa de um avatar virtual para vídeos virais.

Nome: ${input.name}
Descrição: ${input.description}
Estilo visual: ${input.visualStyle || "moderno e autêntico"}
Nicho: ${input.niche || "geral"}
Personalidade: ${input.personality || "carismática e confiável"}

Retorne JSON com masterPrompt (prompt mestre em inglês para consistência visual), personality, visualStyle, defaultClothing, defaultExpressions e imagePrompt (prompt DALL-E em inglês, retrato vertical 9:16).
`

    try {
      return await llmGenerateObject(prompt, AvatarIdentitySchema)
    } catch {
      const fallback = await llmGenerateText(prompt + "\nResponda em JSON válido.")
      const match = fallback.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
      throw new Error("Falha ao gerar identidade do avatar")
    }
  }

  static async generateCharacterImage(
    imagePrompt: string,
    masterPrompt?: string,
    referenceImageUrl?: string | null,
    avatarName?: string,
    options?: {
      directPrompt?: boolean
      useAvatar?: boolean
      visualStyle?: string
      formatoVisual?: string
      publicoAlvo?: string
      categoria?: string
    },
  ): Promise<string> {
    const fullPrompt = options?.directPrompt
      ? imagePrompt
      : buildSceneVisualPrompt({
          sceneDescription: imagePrompt,
          masterPrompt,
          avatarName,
          useAvatar: options?.useAvatar,
          visualStyle: options?.visualStyle,
          formatoVisual: options?.formatoVisual,
          publicoAlvo: options?.publicoAlvo,
          categoria: options?.categoria,
        })

    if (referenceImageUrl) {
      return AIService.generateImageEdit(fullPrompt, referenceImageUrl, {
        forVideo: true,
        inputFidelity: "high",
      })
    }

    return AIService.generateImage(fullPrompt, { forVideo: true })
  }

  static async generateScript(params: {
    prompt: string
    objective: ContentObjective
    durationSeconds: number
    platform: string
    avatarName?: string
    avatarMasterPrompt?: string
    language?: string
    viralContext?: string
    shortParams?: Partial<ShortEditableParams>
  }): Promise<GeneratedScript> {
    const shortConfig = params.shortParams ? buildShortPromptConfig(params.shortParams) : null
    const withAvatar = Boolean(params.avatarName) && (!shortConfig || shortUsesAvatar(shortConfig.PARAMETROS_EDITAVEIS))
    const briefing = shortConfig
      ? buildShortScriptBrief(shortConfig, params.prompt)
      : `Briefing: ${params.prompt}`

    const prompt = `
Você é um roteirista especialista em TikTok, YouTube Shorts e Reels (${SHORT_ASPECT_RATIO}).

${briefing}
Objetivo: ${params.objective}
Plataforma: ${params.platform}
Duração total: ${params.durationSeconds} segundos
Idioma: ${params.language || "pt-BR"}
${withAvatar ? `Avatar/personagem: ${params.avatarName}` : "Sem personagem na câmera: o roteiro descreve fatos, imagens e cenas do tema, não um apresentador."}
${withAvatar && params.avatarMasterPrompt ? `Identidade visual: ${params.avatarMasterPrompt}` : ""}
${params.viralContext ? `\nContexto Viral Engine:\n${params.viralContext}` : ""}

${SHORT_FORM_SCRIPT_RULES}
${shortConfig ? `
Regras extras deste short:
- Público: ${shortConfig.PARAMETROS_EDITAVEIS.publico_alvo}
- Linguagem: ${shortConfig.PARAMETROS_EDITAVEIS.linguagem}
- Tom: ${shortConfig.PARAMETROS_EDITAVEIS.tom}
- Narração: ${shortConfig.PARAMETROS_EDITAVEIS.narracao}
- ${shortConfig.VISUAL.personagem}
- Cada cena do structure.scenes deve ser visualizável no formato escolhido (${shortConfig.PARAMETROS_EDITAVEIS.formato_visual}).
${isAdultSensualCategory(shortConfig.PARAMETROS_EDITAVEIS.categoria) ? `- Short +18 sensual: tensão, sedução e charme. Pessoas 21+. Sem sexo explícito, sem genitália, sem menores.` : ""}
` : ""}

Retorne JSON estruturado.
`

    try {
      return await llmGenerateObject(prompt, ScriptSchema)
    } catch {
      const fallback = await llmGenerateText(prompt + "\nResponda em JSON válido.")
      const match = fallback.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
      throw new Error("Falha ao gerar roteiro")
    }
  }

  static async generateStoryboard(params: {
    script: GeneratedScript
    avatarMasterPrompt?: string
    realisticHuman: boolean
    hasAvatar?: boolean
    shortParams?: Partial<ShortEditableParams>
  }): Promise<StoryboardScene[]> {
    const shortConfig = params.shortParams ? buildShortPromptConfig(params.shortParams) : null
    const useAvatar = Boolean(params.hasAvatar && params.avatarMasterPrompt) &&
      (!shortConfig || shortUsesAvatar(shortConfig.PARAMETROS_EDITAVEIS))
    const visualInstructions = shortConfig
      ? buildShortStoryboardInstructions(shortConfig, useAvatar)
      : useAvatar
        ? "Mantenha o mesmo avatar em todas as cenas."
        : "NÃO mostre apresentador. Descreva cenas concretas do tema."

    const prompt = `
Converta este roteiro em storyboard visual para geração de vídeo vertical 9:16.

Roteiro:
${params.script.fullScript}

Cenas:
${JSON.stringify(params.script.structure.scenes)}

${useAvatar ? `Avatar master prompt (OBRIGATÓRIO nas cenas com personagem): ${params.avatarMasterPrompt}` : "SEM avatar."}
Personagem realista: ${useAvatar && params.realisticHuman ? "sim" : "não"}

${visualInstructions}

REGRAS:
${useAvatar
  ? `- Cenas com personagem devem mostrar EXATAMENTE a mesma pessoa do avatar (mesmo rosto, cabelo, tom de pele, idade).
- O visualPrompt descreve pose, expressão, roupa e cenário — nunca outra pessoa.`
  : `- NÃO descreva talking-head, selfie, influencer ou apresentador.
- Cada visualPrompt deve ser uma cena ilustrativa do conteúdo (objeto, lugar, analogia, recorte, infográfico ou animação).
- Varie as cenas para acompanhar o roteiro, sem repetir o mesmo enquadramento.`}
- visualPrompt em inglês, detalhado, sem texto na imagem.
- Adequado ao público informado.

Para cada cena retorne JSON array com: sceneOrder, title, description, visualPrompt (inglês, detalhado), durationSeconds, provider ("kling" se humano realista com avatar, "gemini" se cenas/animação/educativo), realisticHuman.
`

    const StoryboardSchema = z.object({
      scenes: z.array(
        z.object({
          sceneOrder: z.number(),
          title: z.string(),
          description: z.string(),
          visualPrompt: z.string(),
          durationSeconds: z.number(),
          provider: z.enum(["openai", "gemini", "kling"]),
          realisticHuman: z.boolean(),
        }),
      ),
    })

    try {
      const result = await llmGenerateObject(prompt, StoryboardSchema)
      return result.scenes
    } catch {
      return params.script.structure.scenes.map((scene, index) => ({
        sceneOrder: index,
        title: scene.title,
        description: scene.description,
        visualPrompt: useAvatar
          ? `${params.avatarMasterPrompt || ""} ${scene.description}`.trim()
          : scene.description,
        durationSeconds: scene.durationSeconds,
        provider: useAvatar && params.realisticHuman ? ("kling" as const) : ("gemini" as const),
        realisticHuman: useAvatar && params.realisticHuman,
      }))
    }
  }
}

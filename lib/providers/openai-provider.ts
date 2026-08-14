import { generateObject, generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { buildSceneVisualPrompt } from "@/lib/avatars/scene-prompt"
import { AIService } from "@/lib/ai-service"
import { SHORT_ASPECT_RATIO, SHORT_FORM_SCRIPT_RULES } from "@/lib/short-form"
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
      const result = await generateObject({
        model: openai("gpt-4o"),
        prompt,
        schema: AvatarIdentitySchema,
      })
      return result.object
    } catch {
      const fallback = await generateText({ model: openai("gpt-4o"), prompt: prompt + "\nResponda em JSON válido." })
      const match = fallback.text.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
      throw new Error("Falha ao gerar identidade do avatar")
    }
  }

  static async generateCharacterImage(
    imagePrompt: string,
    masterPrompt?: string,
    referenceImageUrl?: string | null,
    avatarName?: string,
  ): Promise<string> {
    const fullPrompt = buildSceneVisualPrompt({
      sceneDescription: imagePrompt,
      masterPrompt,
      avatarName,
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
  }): Promise<GeneratedScript> {
    const prompt = `
Você é um roteirista especialista em TikTok, YouTube Shorts e Reels (${SHORT_ASPECT_RATIO}).

Briefing: ${params.prompt}
Objetivo: ${params.objective}
Plataforma: ${params.platform}
Duração total: ${params.durationSeconds} segundos
Idioma: ${params.language || "pt-BR"}
${params.avatarName ? `Avatar/personagem: ${params.avatarName}` : ""}
${params.avatarMasterPrompt ? `Identidade visual: ${params.avatarMasterPrompt}` : ""}
${params.viralContext ? `\nContexto Viral Engine:\n${params.viralContext}` : ""}

${SHORT_FORM_SCRIPT_RULES}

Retorne JSON estruturado.
`

    try {
      const result = await generateObject({
        model: openai("gpt-4o"),
        prompt,
        schema: ScriptSchema,
      })
      return result.object
    } catch {
      const fallback = await generateText({ model: openai("gpt-4o"), prompt: prompt + "\nResponda em JSON válido." })
      const match = fallback.text.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
      throw new Error("Falha ao gerar roteiro")
    }
  }

  static async generateStoryboard(params: {
    script: GeneratedScript
    avatarMasterPrompt?: string
    realisticHuman: boolean
  }): Promise<StoryboardScene[]> {
    const prompt = `
Converta este roteiro em storyboard visual para geração de vídeo.

Roteiro:
${params.script.fullScript}

Cenas:
${JSON.stringify(params.script.structure.scenes)}

Avatar master prompt (OBRIGATÓRIO em todas as cenas): ${params.avatarMasterPrompt || "N/A"}
Personagem realista: ${params.realisticHuman ? "sim" : "não"}

REGRAS DE CONSISTÊNCIA:
- Todas as cenas devem mostrar EXATAMENTE a mesma pessoa do avatar (mesmo rosto, cabelo, tom de pele, idade).
- O visualPrompt de cada cena deve descrever apenas pose, expressão, roupa e cenário — nunca outra pessoa.
- Inicie cada visualPrompt repetindo os traços fixos do avatar master prompt.

Para cada cena retorne JSON array com: sceneOrder, title, description, visualPrompt (inglês, detalhado), durationSeconds, provider ("kling" se humano realista, "gemini" se animado/educativo), realisticHuman.
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
      const result = await generateObject({
        model: openai("gpt-4o"),
        prompt,
        schema: StoryboardSchema,
      })
      return result.object.scenes
    } catch {
      return params.script.structure.scenes.map((scene, index) => ({
        sceneOrder: index,
        title: scene.title,
        description: scene.description,
        visualPrompt: `${params.avatarMasterPrompt || ""} ${scene.description}`.trim(),
        durationSeconds: scene.durationSeconds,
        provider: params.realisticHuman ? ("kling" as const) : ("gemini" as const),
        realisticHuman: params.realisticHuman,
      }))
    }
  }
}

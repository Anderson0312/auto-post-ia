import { z } from "zod"
import { StorageService } from "@/lib/storage/gcs-service"
import { llmGenerateObject, llmGenerateText } from "@/lib/llm"
import { getImageProvider, KlingImageService } from "@/lib/providers/kling-image"
import { GeminiImageService, PollinationsImageService } from "@/lib/providers/gemini-image"

export interface PostGenerationRequest {
  themes: string[]
  objective: "engagement" | "awareness" | "sales"
  contentStyle: string
  platform: string
  customInstructions?: string
  language: string
  postFormat: "short" | "medium" | "long"
}

export interface GeneratedPost {
  content: string
  hashtags: string[]
  imagePrompt?: string
  aiPrompt: string
}

// Schema Zod para validação
const PostSchema = z.object({
  content: z.string().describe("O conteúdo do post"),
  hashtags: z.array(z.string()).describe("Array de hashtags sem o símbolo #"),
  imagePrompt: z.string().optional().describe("Prompt para gerar imagem relacionada ao conteúdo"),
})

export class AIService {
  static async generatePost(request: PostGenerationRequest): Promise<GeneratedPost> {
    const { themes, objective, contentStyle, platform, customInstructions, language, postFormat } = request

    // Define character limits based on format
    const characterLimits = {
      short: 100,
      medium: 300,
      long: 500,
    }

    // Define platform-specific guidelines
    const platformGuidelines = {
      instagram: "Use emojis, hashtags relevantes, tom visual e inspiracional",
      linkedin: "Tom profissional, foque em insights de negócios, use quebras de linha",
      facebook: "Tom conversacional, perguntas para engajamento, conteúdo compartilhável",
      twitter: "Conciso, direto, use threads se necessário, hashtags estratégicas",
      threads: "Casual, autêntico, conversacional, similar ao Twitter mas mais pessoal",
    }

    // Define objective-specific instructions
    const objectiveInstructions = {
      engagement: "Inclua perguntas, call-to-actions para comentários, conteúdo que gere discussão",
      awareness: "Foque em educar, compartilhar conhecimento, construir autoridade no assunto",
      sales: "Inclua benefícios claros, call-to-action para ação, senso de urgência sutil",
    }

    const prompt = `
Você é um especialista em marketing de conteúdo e redes sociais. Crie um post para ${platform} seguindo estas diretrizes:

TEMAS: ${themes.join(", ")}
OBJETIVO: ${objective} - ${objectiveInstructions[objective]}
ESTILO: ${contentStyle}
IDIOMA: ${language}
FORMATO: ${postFormat} (máximo ${characterLimits[postFormat]} caracteres)
PLATAFORMA: ${platform} - ${platformGuidelines[platform as keyof typeof platformGuidelines]}

${customInstructions ? `INSTRUÇÕES PERSONALIZADAS: ${customInstructions}` : ""}

REGRAS IMPORTANTES:
1. O conteúdo deve ser original e engajante
2. Respeite o limite de caracteres
3. Inclua hashtags relevantes (3-5 hashtags)
4. Mantenha o tom consistente com o estilo solicitado
5. Adicione valor real para o público
6. Se for para Instagram, inclua emojis moderadamente

Retorne um JSON com:
- content: o texto do post
- hashtags: array de hashtags (sem #)
- imagePrompt: descrição para gerar imagem (opcional, em inglês)
`

    try {
      const parsed = await llmGenerateObject(prompt, PostSchema)
      return {
        content: parsed.content,
        hashtags: parsed.hashtags,
        imagePrompt: parsed.imagePrompt,
        aiPrompt: prompt,
      }
    } catch (error) {
      console.error("Error generating post:", error)
      throw new Error("Falha ao gerar conteúdo com IA")
    }
  }

  static async generateImage(
    prompt: string,
    options?: { size?: "1024x1024" | "1024x1792" | "1792x1024" | "1024x1536" | "1536x1024"; forVideo?: boolean },
  ): Promise<string> {
    const errors: string[] = []

    if (getImageProvider() === "kling") {
      try {
        return await KlingImageService.generateImage(prompt, {
          size: options?.size,
          forVideo: options?.forVideo,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.warn("Kling image falhou:", message)
        errors.push(`Kling: ${message}`)
      }
    }

    try {
      return await PollinationsImageService.generateImage(prompt, { forVideo: options?.forVideo })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn("Pollinations image falhou:", message)
      errors.push(`Pollinations: ${message}`)
    }

    try {
      return await GeminiImageService.generateImage(prompt, { forVideo: options?.forVideo })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn("Gemini image falhou:", message)
      errors.push(`Gemini: ${message}`)
    }

    if (process.env.IMAGE_PROVIDER === "openai" || process.env.IMAGE_ALLOW_OPENAI === "true") {
      return this.generateImageWithOpenAI(prompt, options)
    }

    throw new Error(
      `Nenhum provedor de imagem disponível. Kling e OpenAI estão sem crédito. ${errors.join(" | ")}`,
    )
  }

  private static async generateImageWithOpenAI(
    prompt: string,
    options?: { size?: "1024x1024" | "1024x1792" | "1792x1024" | "1024x1536" | "1536x1024"; forVideo?: boolean },
  ): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("Nenhum provedor de imagem disponível (Kling falhou e OPENAI_API_KEY não está configurada)")
    }

    const trimmedPrompt = prompt.length > 3800 ? `${prompt.slice(0, 3800)}...` : prompt
    const requestedSize = options?.size || (options?.forVideo ? "1024x1536" : "1024x1024")
    const size =
      requestedSize === "1024x1792" ? "1024x1536" :
      requestedSize === "1792x1024" ? "1536x1024" :
      requestedSize

    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini"

    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt: trimmedPrompt,
          size,
          quality: "high",
          n: 1,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error("OpenAI Images API error:", response.status, errorBody)
        throw new Error(`OpenAI Images API ${response.status}: ${errorBody.slice(0, 400)}`)
      }

      const data = await response.json()
      const item = data?.data?.[0]

      if (item?.url) {
        return item.url
      }

      if (item?.b64_json) {
        const buffer = Buffer.from(item.b64_json, "base64")
        const uploaded = await StorageService.uploadBuffer(
          buffer,
          StorageService.buildPath("generated/openai", "image.png"),
          "image/png",
        )
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        return uploaded.publicUrl.startsWith("http")
          ? uploaded.publicUrl
          : `${baseUrl}${uploaded.publicUrl}`
      }

      throw new Error("OpenAI não retornou URL nem base64 da imagem")
    } catch (error) {
      console.error("Error generating image:", error)
      if (error instanceof Error) throw error
      throw new Error("Falha ao gerar imagem com IA")
    }
  }

  static async generateImageEdit(
    prompt: string,
    referenceImageUrl: string,
    options?: { forVideo?: boolean; inputFidelity?: "high" | "low" },
  ): Promise<string> {
    const errors: string[] = []

    if (getImageProvider() === "kling") {
      try {
        return await KlingImageService.generateImage(prompt, {
          forVideo: options?.forVideo,
          referenceImageUrl,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.warn("Kling image-edit falhou:", message)
        errors.push(`Kling: ${message}`)
      }
    }

    try {
      return await PollinationsImageService.generateImage(prompt, { forVideo: options?.forVideo })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn("Pollinations image-edit falhou:", message)
      errors.push(`Pollinations: ${message}`)
    }

    try {
      return await GeminiImageService.generateImage(prompt, {
        forVideo: options?.forVideo,
        referenceImageUrl,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn("Gemini image-edit falhou:", message)
      errors.push(`Gemini: ${message}`)
    }

    if (process.env.IMAGE_ALLOW_OPENAI === "true") {
      return this.generateImageEditWithOpenAI(prompt, referenceImageUrl, options)
    }

    throw new Error(`Não foi possível gerar a variação da imagem. ${errors.join(" | ")}`)
  }

  private static async generateImageEditWithOpenAI(
    prompt: string,
    referenceImageUrl: string,
    options?: { forVideo?: boolean; inputFidelity?: "high" | "low" },
  ): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error("OPENAI_API_KEY não configurada")

    const buffer = await StorageService.resolveMediaBuffer(referenceImageUrl)
    const trimmedPrompt = prompt.length > 32000 ? `${prompt.slice(0, 32000)}...` : prompt
    const size = options?.forVideo ? "1024x1536" : "1024x1024"
    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini"

    const form = new FormData()
    form.append("image", new Blob([buffer], { type: "image/png" }), "reference.png")
    form.append("prompt", trimmedPrompt)
    form.append("model", model)
    form.append("size", size)
    form.append("quality", "high")

    if (
      options?.inputFidelity &&
      (model === "gpt-image-1" || model === "gpt-image-1.5" || model.startsWith("gpt-image-1.5-"))
    ) {
      form.append("input_fidelity", options.inputFidelity)
    }

    try {
      const response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error("OpenAI Images Edit API error:", response.status, errorBody)
        throw new Error(`OpenAI Images Edit API ${response.status}: ${errorBody.slice(0, 400)}`)
      }

      const data = await response.json()
      const item = data?.data?.[0]

      if (item?.url) {
        return item.url
      }

      if (item?.b64_json) {
        const imageBuffer = Buffer.from(item.b64_json, "base64")
        const uploaded = await StorageService.uploadBuffer(
          imageBuffer,
          StorageService.buildPath("generated/openai", "scene-edit.png"),
          "image/png",
        )
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        return uploaded.publicUrl.startsWith("http")
          ? uploaded.publicUrl
          : `${baseUrl}${uploaded.publicUrl}`
      }

      throw new Error("OpenAI edit não retornou URL nem base64 da imagem")
    } catch (error) {
      console.error("Error generating image edit:", error)
      if (error instanceof Error) throw error
      throw new Error("Falha ao gerar imagem com referência")
    }
  }

  static async improvePost(originalContent: string, feedback: string): Promise<string> {
    const prompt = `
Melhore este post de rede social baseado no feedback fornecido:

POST ORIGINAL:
${originalContent}

FEEDBACK:
${feedback}

Retorne apenas o post melhorado, mantendo o mesmo tom e estilo, mas incorporando as sugestões do feedback.
`

    try {
      const result = await llmGenerateText(prompt)
      return result
    } catch (error) {
      console.error("Error improving post:", error)
      throw new Error("Falha ao melhorar post com IA")
    }
  }
}

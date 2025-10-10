import { generateText, generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

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
      // Tentar primeiro com generateObject usando schema Zod
      try {
        const result = await generateObject({
          model: openai("gpt-4o"),
          prompt,
          schema: PostSchema,
        })

        return {
          content: result.object.content,
          hashtags: result.object.hashtags,
          imagePrompt: result.object.imagePrompt,
          aiPrompt: prompt,
        }
      } catch (generateObjectError) {
        console.warn("generateObject failed, falling back to generateText:", generateObjectError)
        
        // Fallback para generateText se generateObject falhar
        const result = await generateText({
          model: openai("gpt-4o"),
          prompt: prompt + "\n\nResponda APENAS com um JSON válido no formato:\n{\n  \"content\": \"texto do post\",\n  \"hashtags\": [\"hashtag1\", \"hashtag2\"],\n  \"imagePrompt\": \"descrição da imagem\"\n}",
        })

        // Tentar fazer parse do JSON
        try {
          const jsonMatch = result.text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            return {
              content: parsed.content || "Post gerado automaticamente",
              hashtags: parsed.hashtags || [],
              imagePrompt: parsed.imagePrompt,
              aiPrompt: prompt,
            }
          }
        } catch (parseError) {
          console.warn("Failed to parse JSON response:", parseError)
        }

        // Fallback final - resposta simples
        return {
          content: result.text.substring(0, 280) || "Post gerado automaticamente sobre " + themes.join(", "),
          hashtags: themes.slice(0, 3),
          imagePrompt: `Professional social media image about ${themes[0]}`,
          aiPrompt: prompt,
        }
      }
    } catch (error) {
      console.error("Error generating post:", error)
      throw new Error("Falha ao gerar conteúdo com IA")
    }
  }

  static async generateImage(prompt: string): Promise<string> {
    try {
      // Using OpenAI DALL-E for image generation
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Create a professional social media image: ${prompt}. Style: modern, clean, visually appealing, suitable for social media posts.`,
          size: "1024x1024",
          quality: "standard",
          n: 1,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate image")
      }

      const data = await response.json()
      return data.data[0].url
    } catch (error) {
      console.error("Error generating image:", error)
      throw new Error("Falha ao gerar imagem com IA")
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
      const result = await generateText({
        model: openai("gpt-4o"),
        prompt,
      })

      return result.text
    } catch (error) {
      console.error("Error improving post:", error)
      throw new Error("Falha ao melhorar post com IA")
    }
  }
}

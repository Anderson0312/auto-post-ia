import { envFirst } from "@/lib/env"
import { StorageService } from "@/lib/storage/gcs-service"

function geminiKey() {
  return envFirst("GEMINI_API_KEY", "gemini_api_key", "GOOGLE_GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY")
}

function pollinationsKey() {
  return envFirst("POLLINATIONS_API_KEY", "POLLINATIONS_KEY")
}

function imageModels() {
  const preferred = process.env.GEMINI_IMAGE_MODEL?.trim()
  const defaults = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"]
  return [...new Set(preferred ? [preferred, ...defaults] : defaults)]
}

function dimensions(forVideo?: boolean) {
  return forVideo ? { width: 1024, height: 1792 } : { width: 1024, height: 1024 }
}

function compactPrompt(prompt: string, max = 280) {
  return prompt.replace(/\s+/g, " ").trim().slice(0, max)
}

export async function persistGeneratedImage(buffer: Buffer, folder: string) {
  const uploaded = await StorageService.uploadBuffer(
    buffer,
    StorageService.buildPath(`generated/${folder}`, `image-${Date.now()}.png`),
    "image/png",
  )
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  return uploaded.publicUrl.startsWith("http")
    ? uploaded.publicUrl
    : `${baseUrl}${uploaded.publicUrl}`
}

async function bufferFromResponse(response: Response) {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const data = await response.json()
    const b64 = data?.data?.[0]?.b64_json
    const url = data?.data?.[0]?.url
    if (b64) return Buffer.from(b64, "base64")
    if (url) {
      const imageRes = await fetch(url)
      if (!imageRes.ok) throw new Error(`Download Pollinations ${imageRes.status}`)
      return Buffer.from(await imageRes.arrayBuffer())
    }
    throw new Error(data?.error?.message || "Pollinations JSON sem imagem")
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length < 1000) throw new Error("Pollinations retornou imagem inválida")
  return buffer
}

export class GeminiImageService {
  static async generateImage(
    prompt: string,
    options?: { forVideo?: boolean; referenceImageUrl?: string | null },
  ): Promise<string> {
    const apiKey = geminiKey()
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada")

    const trimmed = prompt.length > 3000 ? `${prompt.slice(0, 3000)}...` : prompt
    const parts: Array<Record<string, unknown>> = [{ text: trimmed }]

    if (options?.referenceImageUrl) {
      const buffer = await StorageService.resolveMediaBuffer(options.referenceImageUrl)
      parts.unshift({
        inlineData: {
          mimeType: "image/png",
          data: buffer.toString("base64"),
        },
      })
      parts[1] = {
        text: `Keep the same person from the reference image. ${trimmed}`,
      }
    }

    let lastError: Error | null = null

    for (const model of imageModels()) {
      for (const modalities of [["IMAGE"], ["TEXT", "IMAGE"]]) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                responseModalities: modalities,
                imageConfig: { aspectRatio: options?.forVideo ? "9:16" : "1:1" },
              },
            }),
          },
        )

        const data = await response.json()
        if (!response.ok) {
          lastError = new Error(data?.error?.message || `Gemini image ${model} HTTP ${response.status}`)
          continue
        }

        const responseParts = data?.candidates?.[0]?.content?.parts as
          | Array<{ inlineData?: { data?: string } }>
          | undefined
        const imagePart = responseParts?.find((part) => part.inlineData?.data)
        if (!imagePart?.inlineData?.data) {
          lastError = new Error(`Gemini ${model} não retornou imagem`)
          continue
        }

        return persistGeneratedImage(Buffer.from(imagePart.inlineData.data, "base64"), "gemini")
      }
    }

    throw lastError || new Error("Gemini não gerou imagem")
  }
}

export class PollinationsImageService {
  static async generateImage(prompt: string, options?: { forVideo?: boolean }): Promise<string> {
    const { width, height } = dimensions(options?.forVideo)
    const shortPrompt = compactPrompt(prompt, 240)
    const models = ["flux", "turbo", "gptimage"]
    const key = pollinationsKey()
    const errors: string[] = []

    for (const model of models) {
      try {
        const response = await fetch("https://gen.pollinations.ai/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(key ? { Authorization: `Bearer ${key}` } : {}),
          },
          body: JSON.stringify({
            prompt: shortPrompt,
            model,
            n: 1,
            size: `${width}x${height}`,
            response_format: "b64_json",
          }),
        })

        if (response.ok) {
          const buffer = await bufferFromResponse(response)
          return persistGeneratedImage(buffer, "pollinations")
        }
        errors.push(`POST ${model} ${response.status}`)
      } catch (error) {
        errors.push(`POST ${model}: ${error instanceof Error ? error.message : String(error)}`)
      }

      try {
        const url =
          `https://gen.pollinations.ai/image/${encodeURIComponent(shortPrompt)}` +
          `?width=${width}&height=${height}&nologo=true&model=${model}&seed=${Date.now()}`
        const response = await fetch(url, {
          headers: {
            Accept: "image/png,image/jpeg,*/*",
            ...(key ? { Authorization: `Bearer ${key}` } : {}),
          },
        })
        if (response.ok) {
          const buffer = await bufferFromResponse(response)
          return persistGeneratedImage(buffer, "pollinations")
        }
        errors.push(`GET ${model} ${response.status}`)
      } catch (error) {
        errors.push(`GET ${model}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    throw new Error(`Pollinations falhou (${errors.join("; ")})`)
  }
}

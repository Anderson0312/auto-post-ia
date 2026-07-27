import { envFirst } from "@/lib/env"
import { StorageService } from "@/lib/storage/gcs-service"
import type { GenerationJobResult, VideoGenerationInput } from "@/lib/types/video-platform"
import type { VideoProvider } from "@/lib/providers/types"

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

export class GeminiProvider implements VideoProvider {
  readonly name = "gemini" as const

  private get apiKey() {
    return envFirst("GEMINI_API_KEY", "gemini_api_key", "GOOGLE_GEMINI_API_KEY")
  }

  private get videoModel() {
    return process.env.GEMINI_VIDEO_MODEL || "veo-3.1-fast-generate-preview"
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      "x-goog-api-key": this.apiKey || "",
    }
  }

  private async resolveInlineImage(imageUrl: string) {
    const buffer = await StorageService.resolveMediaBuffer(imageUrl)
    const mimeType = imageUrl.match(/\.jpe?g/i) ? "image/jpeg" : "image/png"
    return {
      inlineData: {
        mimeType,
        data: buffer.toString("base64"),
      },
    }
  }

  async generateVideo(input: VideoGenerationInput): Promise<GenerationJobResult> {
    if (!this.apiKey) {
      return {
        status: "failed",
        errorMessage: "GEMINI_API_KEY não configurada",
      }
    }

    try {
      const videoPrompt = input.avatarMasterPrompt
        ? `${input.avatarMasterPrompt}. ${input.prompt}`
        : input.prompt

      const instance: Record<string, unknown> = { prompt: videoPrompt }

      if (input.imageUrl) {
        instance.image = await this.resolveInlineImage(input.imageUrl)
      }

      const response = await fetch(
        `${BASE_URL}/models/${this.videoModel}:predictLongRunning`,
        {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({
            instances: [instance],
            parameters: {
              aspectRatio: input.aspectRatio || "9:16",
              ...(input.durationSeconds ? { durationSeconds: input.durationSeconds } : {}),
            },
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        const message = data?.error?.message || `Gemini API error ${response.status}`
        return {
          status: "failed",
          errorMessage: formatGeminiVideoError(message),
        }
      }

      const operationName = data.name
      if (!operationName) {
        return { status: "failed", errorMessage: "Resposta Gemini sem operation ID" }
      }

      return {
        status: "processing",
        externalJobId: operationName,
        outputData: data,
      }
    } catch (error) {
      return {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Erro Gemini",
      }
    }
  }

  async getJobStatus(externalJobId: string): Promise<GenerationJobResult> {
    if (!this.apiKey) {
      return { status: "failed", errorMessage: "GEMINI_API_KEY não configurada" }
    }

    try {
      const operationPath = externalJobId.startsWith("operations/")
        ? externalJobId
        : externalJobId

      const response = await fetch(`${BASE_URL}/${operationPath}`, {
        headers: { "x-goog-api-key": this.apiKey },
      })

      if (!response.ok) {
        return { status: "failed", errorMessage: await response.text() }
      }

      const data = await response.json()

      if (data.done) {
        const videoUri =
          data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
          data.response?.generatedVideos?.[0]?.video?.uri ||
          data.response?.predictions?.[0]?.videoUri

        if (videoUri) {
          return {
            status: "completed",
            externalJobId,
            outputUrl: videoUri,
            outputData: data.response,
          }
        }

        if (data.error) {
          return {
            status: "failed",
            externalJobId,
            errorMessage: formatGeminiVideoError(JSON.stringify(data.error)),
          }
        }
      }

      return { status: "processing", externalJobId, outputData: data }
    } catch (error) {
      return {
        status: "failed",
        externalJobId,
        errorMessage: error instanceof Error ? error.message : "Erro ao consultar Gemini",
      }
    }
  }

  async downloadVideo(videoUri: string, storagePath: string) {
    const uploaded = await StorageService.uploadFromUrl(videoUri, storagePath, {
      headers: { "x-goog-api-key": this.apiKey || "" },
    })
    return uploaded.publicUrl
  }
}

export function formatGeminiVideoError(message: string): string {
  if (/billing|quota|prepay|paid tier/i.test(message)) {
    return (
      "Gemini Veo requer billing ativo no Google AI Studio. " +
      "Ative em aistudio.google.com → Billing (Tier pago, ~$10 prepay). " +
      `Detalhe: ${message.slice(0, 200)}`
    )
  }
  return message
}

export function preferGeminiVideoProvider(): boolean {
  const value = (process.env.VIDEO_PROVIDER || process.env.PREFERRED_VIDEO_PROVIDER || "").toLowerCase()
  return value === "gemini"
}

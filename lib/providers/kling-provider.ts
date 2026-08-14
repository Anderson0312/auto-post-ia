import { envFirst } from "@/lib/env"
import { formatKlingApiError } from "@/lib/providers/kling-account"
import { createKlingJwt } from "@/lib/providers/kling-auth"
import { StorageService } from "@/lib/storage/gcs-service"
import type { GenerationJobResult, VideoGenerationInput } from "@/lib/types/video-platform"
import type { VideoProvider } from "@/lib/providers/types"

interface KlingTaskResponse {
  code?: number
  message?: string
  data?: {
    task_id?: string
    task_status?: string
    task_result?: {
      videos?: Array<{ url?: string; duration?: string }>
    }
  }
}

export class KlingProvider implements VideoProvider {
  readonly name = "kling" as const

  private get accessKey() {
    return envFirst("KLING_ACCESS_KEY", "Access_Key_kling_ai", "KLING_API_KEY")
  }

  private get secretKey() {
    return envFirst("KLING_SECRET_KEY", "Secret_Key_kling_ai")
  }

  private get baseUrl() {
    return process.env.KLING_API_BASE_URL || "https://api.klingai.com"
  }

  private async getAuthToken(): Promise<string | null> {
    if (process.env.KLING_API_TOKEN) return process.env.KLING_API_TOKEN

    const accessKey = this.accessKey
    const secretKey = this.secretKey
    if (!accessKey) return null
    if (!secretKey) return accessKey

    return createKlingJwt(accessKey, secretKey)
  }

  private async resolveImageInput(imageUrl: string): Promise<string> {
    const isLocal =
      imageUrl.startsWith("/") ||
      imageUrl.includes("localhost") ||
      imageUrl.includes("/api/media/")

    if (!isLocal) return imageUrl

    const buffer = await StorageService.resolveMediaBuffer(imageUrl)
    return buffer.toString("base64")
  }

  async generateVideo(input: VideoGenerationInput): Promise<GenerationJobResult> {
    const token = await this.getAuthToken()
    if (!token) {
      return { status: "failed", errorMessage: "KLING_ACCESS_KEY ou KLING_API_KEY não configurada" }
    }

    try {
      const endpoint = input.imageUrl ? "/v1/videos/image2video" : "/v1/videos/text2video"
      const imagePayload = input.imageUrl ? await this.resolveImageInput(input.imageUrl) : undefined
      const videoPrompt = input.avatarMasterPrompt
        ? `${input.avatarMasterPrompt}. ${input.prompt}`
        : input.prompt

      const modelName = process.env.KLING_VIDEO_MODEL || "kling-v2-6"
      const requested = Number(input.durationSeconds || 5)
      const duration = requested <= 5 ? "5" : "10"

      const body = imagePayload
        ? {
            model_name: modelName,
            image: imagePayload,
            prompt: videoPrompt,
            duration,
            aspect_ratio: input.aspectRatio || "9:16",
            mode: "std",
          }
        : {
            model_name: modelName,
            prompt: videoPrompt,
            duration,
            aspect_ratio: input.aspectRatio || "9:16",
            mode: "std",
          }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = (await response.json()) as KlingTaskResponse

      if (!response.ok || data.code !== 0) {
        return {
          status: "failed",
          errorMessage: formatKlingApiError(data.code, data.message || `Kling API error ${response.status}`),
        }
      }

      const taskId = data.data?.task_id
      if (!taskId) {
        return { status: "failed", errorMessage: "Kling não retornou task_id" }
      }

      return {
        status: "processing",
        externalJobId: taskId,
        outputData: data as unknown as Record<string, unknown>,
      }
    } catch (error) {
      return {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Erro Kling",
      }
    }
  }

  async getJobStatus(externalJobId: string): Promise<GenerationJobResult> {
    const token = await this.getAuthToken()
    if (!token) {
      return { status: "failed", errorMessage: "KLING_ACCESS_KEY não configurada" }
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/videos/tasks/${externalJobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = (await response.json()) as KlingTaskResponse
      const status = data.data?.task_status

      if (status === "succeed" || status === "completed") {
        const videoUrl = data.data?.task_result?.videos?.[0]?.url
        return {
          status: "completed",
          externalJobId,
          outputUrl: videoUrl,
          outputData: data as unknown as Record<string, unknown>,
        }
      }

      if (status === "failed" || status === "error") {
        return {
          status: "failed",
          externalJobId,
          errorMessage: data.message || "Kling task failed",
        }
      }

      return { status: "processing", externalJobId, outputData: data as unknown as Record<string, unknown> }
    } catch (error) {
      return {
        status: "failed",
        externalJobId,
        errorMessage: error instanceof Error ? error.message : "Erro ao consultar Kling",
      }
    }
  }
}

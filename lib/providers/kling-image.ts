import { formatKlingApiError, getKlingAuthToken, getKlingBaseUrl } from "@/lib/providers/kling-account"
import { StorageService } from "@/lib/storage/gcs-service"

interface KlingImageTaskResponse {
  code?: number
  message?: string
  data?: {
    task_id?: string
    task_status?: string
    task_result?: {
      images?: Array<{ url?: string }>
    }
  }
}

function aspectRatioFromSize(size?: string, forVideo?: boolean) {
  if (forVideo) return "9:16"
  if (size === "1024x1792" || size === "1024x1536") return "9:16"
  if (size === "1792x1024" || size === "1536x1024") return "16:9"
  return "9:16"
}

async function resolveImageInput(imageUrl: string) {
  const isLocal =
    imageUrl.startsWith("/") ||
    imageUrl.includes("localhost") ||
    imageUrl.includes("/api/media/")

  if (!isLocal) return imageUrl
  const buffer = await StorageService.resolveMediaBuffer(imageUrl)
  return buffer.toString("base64")
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export class KlingImageService {
  static async generateImage(
    prompt: string,
    options?: {
      size?: string
      forVideo?: boolean
      referenceImageUrl?: string | null
    },
  ): Promise<string> {
    const token = await getKlingAuthToken()
    if (!token) throw new Error("KLING_ACCESS_KEY não configurada")

    const baseUrl = getKlingBaseUrl()
    const modelName = process.env.KLING_IMAGE_MODEL || "kling-v1"
    const trimmedPrompt = prompt.length > 2400 ? `${prompt.slice(0, 2400)}...` : prompt
    const imagePayload = options?.referenceImageUrl
      ? await resolveImageInput(options.referenceImageUrl)
      : undefined

    const body: Record<string, unknown> = {
      model_name: modelName,
      prompt: trimmedPrompt,
      n: 1,
      aspect_ratio: aspectRatioFromSize(options?.size, options?.forVideo),
    }

    if (imagePayload) {
      body.image = imagePayload
      body.image_fidelity = 0.65
    }

    const response = await fetch(`${baseUrl}/v1/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = (await response.json()) as KlingImageTaskResponse
    if (!response.ok || (data.code !== undefined && data.code !== 0)) {
      throw new Error(formatKlingApiError(data.code, data.message || `Kling image ${response.status}`))
    }

    const taskId = data.data?.task_id
    if (!taskId) throw new Error("Kling não retornou task_id da imagem")

    return this.pollImage(taskId)
  }

  private static async pollImage(taskId: string, maxAttempts = 40, delayMs = 3000): Promise<string> {
    const token = await getKlingAuthToken()
    if (!token) throw new Error("KLING_ACCESS_KEY não configurada")
    const baseUrl = getKlingBaseUrl()

    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${baseUrl}/v1/images/generations/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await response.json()) as KlingImageTaskResponse
      const status = data.data?.task_status

      if (status === "succeed" || status === "completed") {
        const url = data.data?.task_result?.images?.[0]?.url
        if (!url) throw new Error("Kling concluiu a imagem sem URL")
        return url
      }

      if (status === "failed" || status === "error") {
        throw new Error(formatKlingApiError(data.code, data.message || "Kling falhou ao gerar imagem"))
      }

      await sleep(delayMs)
    }

    throw new Error("Timeout aguardando imagem da Kling")
  }
}

export function getImageProvider(): "kling" | "openai" {
  const forced = (process.env.IMAGE_PROVIDER || "kling").toLowerCase()
  if (forced === "openai") return "openai"
  return "kling"
}

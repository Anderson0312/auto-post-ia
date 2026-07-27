import { envFirst } from "@/lib/env"

export interface GeminiAccountStatus {
  configured: boolean
  model: string
  canGenerateVideo: boolean
  message: string
}

function getApiKey() {
  return envFirst("GEMINI_API_KEY", "gemini_api_key", "GOOGLE_GEMINI_API_KEY")
}

function getVideoModel() {
  return process.env.GEMINI_VIDEO_MODEL || "veo-3.1-fast-generate-preview"
}

export async function getGeminiAccountStatus(): Promise<GeminiAccountStatus> {
  const apiKey = getApiKey()
  const model = getVideoModel()

  if (!apiKey) {
    return {
      configured: false,
      model,
      canGenerateVideo: false,
      message: "GEMINI_API_KEY não configurada. Crie em aistudio.google.com/apikey",
    }
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          instances: [{ prompt: "status check" }],
          parameters: { aspectRatio: "9:16" },
        }),
      },
    )

    const payload = await response.json()

    if (response.ok && payload.name) {
      return {
        configured: true,
        model,
        canGenerateVideo: true,
        message: `Gemini Veo pronto (${model}).`,
      }
    }

    const errorMessage = payload?.error?.message || `HTTP ${response.status}`
    const needsBilling = /billing|quota|prepay|paid tier|GCP/i.test(errorMessage)

    return {
      configured: true,
      model,
      canGenerateVideo: false,
      message: needsBilling
        ? "Chave OK, mas é preciso ativar billing no Google AI Studio (Tier pago) para usar Veo. " +
          "Acesse aistudio.google.com → Billing → Set up billing."
        : errorMessage,
    }
  } catch (error) {
    return {
      configured: true,
      model,
      canGenerateVideo: false,
      message: error instanceof Error ? error.message : "Erro ao validar Gemini",
    }
  }
}

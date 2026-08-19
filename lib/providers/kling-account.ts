import { envFirst } from "@/lib/env"
import { createKlingJwt } from "@/lib/providers/kling-auth"

export interface KlingResourcePack {
  resource_pack_name: string
  resource_pack_id: string
  remaining_quantity: number
  total_quantity: number
  status: string
  invalid_time?: number
}

export interface KlingAccountStatus {
  authenticated: boolean
  baseUrl: string
  resourcePacks: KlingResourcePack[]
  totalRemaining: number
  canGenerateVideo: boolean
  message: string
}

function getBaseUrl() {
  return process.env.KLING_API_BASE_URL || "https://api.klingai.com"
}

async function getToken() {
  if (process.env.KLING_API_TOKEN) return process.env.KLING_API_TOKEN

  const accessKey = envFirst("KLING_ACCESS_KEY", "Access_Key_kling_ai", "KLING_API_KEY")
  const secretKey = envFirst("KLING_SECRET_KEY", "Secret_Key_kling_ai")
  if (!accessKey || !secretKey) return null

  return createKlingJwt(accessKey, secretKey)
}

export async function getKlingAuthToken() {
  return getToken()
}

export function getKlingBaseUrl() {
  return getBaseUrl()
}

export async function getKlingAccountStatus(): Promise<KlingAccountStatus> {
  const baseUrl = getBaseUrl()
  const token = await getToken()

  if (!token) {
    return {
      authenticated: false,
      baseUrl,
      resourcePacks: [],
      totalRemaining: 0,
      canGenerateVideo: false,
      message: "Chaves Kling não configuradas (KLING_ACCESS_KEY + KLING_SECRET_KEY).",
    }
  }

  const now = Date.now()
  const startTime = now - 90 * 24 * 60 * 60 * 1000

  try {
    const response = await fetch(
      `${baseUrl}/account/costs?start_time=${startTime}&end_time=${now}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    const payload = await response.json()
    const packs =
      (payload?.data?.resource_pack_subscribe_infos as KlingResourcePack[] | undefined) ||
      (payload?.data?.data?.resource_pack_subscribe_infos as KlingResourcePack[] | undefined) ||
      []

    const activePacks = packs.filter(
      (pack) => pack.status === "online" && (pack.remaining_quantity ?? 0) > 0,
    )
    const totalRemaining = activePacks.reduce(
      (sum, pack) => sum + (pack.remaining_quantity || 0),
      0,
    )

    if (activePacks.length === 0) {
      return {
        authenticated: true,
        baseUrl,
        resourcePacks: packs,
        totalRemaining: 0,
        canGenerateVideo: false,
        message:
          "Autenticação OK, mas não há pacote de recursos da API ativo (erro 1102). " +
          "Os créditos do site/app Kling são diferentes dos créditos da API. " +
          "Compre um pacote em app.klingai.com/global/dev → API / Recursos.",
      }
    }

    return {
      authenticated: true,
      baseUrl,
      resourcePacks: activePacks,
      totalRemaining,
      canGenerateVideo: true,
      message: `API Kling pronta. Saldo estimado: ${totalRemaining} unidades.`,
    }
  } catch (error) {
    return {
      authenticated: true,
      baseUrl,
      resourcePacks: [],
      totalRemaining: 0,
      canGenerateVideo: false,
      message: error instanceof Error ? error.message : "Erro ao consultar saldo Kling",
    }
  }
}

export function formatKlingApiError(code?: number, message?: string): string {
  if (code === 1102 || /balance|balance not enough|资源包/i.test(message || "")) {
    return (
      "Pacote de recursos da API Kling esgotado ou expirado (código 1102). " +
      "Créditos do app/site não servem para a API — compre um pacote em " +
      "app.klingai.com/global/dev e use as chaves dessa mesma conta."
    )
  }
  return message || "Erro na API Kling"
}

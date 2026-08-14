import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  const { getKlingAccountStatus } = await import("../lib/providers/kling-account")
  const { envFirst } = await import("../lib/env")
  const { createKlingJwt } = await import("../lib/providers/kling-auth")

  const account = await getKlingAccountStatus()
  console.log("authenticated:", account.authenticated)
  console.log("canGenerateVideo:", account.canGenerateVideo)
  console.log("totalRemaining:", account.totalRemaining)
  console.log("message:", account.message)
  console.log("packs:", account.resourcePacks.length)
  for (const pack of account.resourcePacks) {
    console.log(
      `  - ${pack.resource_pack_name}: ${pack.remaining_quantity}/${pack.total_quantity} status=${pack.status}`,
    )
  }

  if (!account.canGenerateVideo) {
    const accessKey = envFirst("KLING_ACCESS_KEY", "Access_Key_kling_ai", "KLING_API_KEY")
    const secretKey = envFirst("KLING_SECRET_KEY", "Secret_Key_kling_ai")
    if (!accessKey || !secretKey) {
      console.log("Chaves ausentes no .env.local")
      process.exit(1)
    }

    const token = await createKlingJwt(accessKey, secretKey)
    const now = Date.now()
    const startTime = now - 90 * 24 * 60 * 60 * 1000
    const response = await fetch(
      `https://api.klingai.com/account/costs?start_time=${startTime}&end_time=${now}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const payload = await response.json()
    console.log("HTTP:", response.status)
    console.log("code:", payload?.code)
    console.log("message:", payload?.message)
    const dataKeys = payload?.data ? Object.keys(payload.data) : []
    console.log("data keys:", dataKeys.join(", ") || "(none)")
    const infos =
      payload?.data?.resource_pack_subscribe_infos ||
      payload?.data?.data?.resource_pack_subscribe_infos ||
      payload?.data?.resourcePackSubscribeInfos
    console.log("raw pack count:", Array.isArray(infos) ? infos.length : 0)
    if (Array.isArray(infos) && infos[0]) {
      console.log("first pack keys:", Object.keys(infos[0]).join(", "))
      const sample = infos[0]
      console.log("first pack status:", sample.status)
      console.log("first pack remaining:", sample.remaining_quantity)
      console.log("first pack name:", sample.resource_pack_name)
    }
  }
}

main().catch((err) => {
  console.error("Falha ao consultar Kling:", err.message)
  process.exit(1)
})

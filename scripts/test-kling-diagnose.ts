import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  const { envFirst } = await import("../lib/env")
  const { createKlingJwt } = await import("../lib/providers/kling-auth")

  const accessKey = envFirst("KLING_ACCESS_KEY", "Access_Key_kling_ai", "KLING_API_KEY")
  const secretKey = envFirst("KLING_SECRET_KEY", "Secret_Key_kling_ai")
  if (!accessKey || !secretKey) throw new Error("Chaves Kling não configuradas")

  const baseUrl = process.env.KLING_API_BASE_URL || "https://api.klingai.com"
  const token = await createKlingJwt(accessKey, secretKey)

  const now = Date.now()
  const startTime = now - 30 * 24 * 60 * 60 * 1000

  console.log("Base URL:", baseUrl)
  console.log("Access key prefix:", accessKey.slice(0, 6) + "...")

  for (const path of [
    "/v1/account/balance",
    "/v1/account/packages",
    `/account/costs?start_time=${startTime}&end_time=${now}`,
  ]) {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const text = await res.text()
    console.log(`\nGET ${path} -> ${res.status}`)
    console.log(text.slice(0, 1200))
  }

  const beijing = "https://api-beijing.klingai.com"
  const resBeijing = await fetch(`${beijing}/v1/account/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  console.log(`\nGET ${beijing}/v1/account/balance -> ${resBeijing.status}`)
  console.log((await resBeijing.text()).slice(0, 1200))

  for (const host of [baseUrl, "https://api-beijing.klingai.com"]) {
    const res = await fetch(`${host}/account/costs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ start_time: startTime, end_time: now }),
    })
    console.log(`\nPOST ${host}/account/costs -> ${res.status}`)
    console.log((await res.text()).slice(0, 1500))
  }

  const models = ["kling-v2-6", "kling-v2-1", "kling-v1-6", "kling-v1"]
  for (const model_name of models) {
    const res = await fetch(`${baseUrl}/v1/videos/text2video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_name,
        prompt: "A person smiling at camera, subtle movement",
        duration: "5",
        aspect_ratio: "9:16",
        mode: "std",
      }),
    })
    const data = await res.json()
    console.log(`\nmodel ${model_name}: code=${data.code} msg=${data.message || "ok"}`)
    if (data.data?.task_id) {
      console.log("task_id:", data.data.task_id)
      break
    }
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})

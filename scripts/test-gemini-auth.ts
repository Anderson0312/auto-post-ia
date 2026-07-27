import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  const { getGeminiAccountStatus } = await import("../lib/providers/gemini-account")

  const status = await getGeminiAccountStatus()
  console.log("Modelo:", status.model)
  console.log(status.message)

  if (!status.configured) process.exit(1)
}

main().catch((err) => {
  console.error("Teste Gemini falhou:", err.message)
  process.exit(1)
})

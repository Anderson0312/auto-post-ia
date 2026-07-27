import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  const { AIService } = await import("../lib/ai-service")

  console.log("Modelo:", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini")

  const url = await AIService.generateImage(
    "Young professional in modern office, vertical portrait, photorealistic, soft lighting, no text",
    { forVideo: true },
  )

  console.log("Imagem gerada:", url.slice(0, 120) + (url.length > 120 ? "..." : ""))
  console.log("Teste de imagem OK.")
}

main().catch((err) => {
  console.error("Teste de imagem falhou:", err.message)
  process.exit(1)
})

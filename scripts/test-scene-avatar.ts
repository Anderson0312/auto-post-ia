import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  const { OpenAIProvider } = await import("../lib/providers/openai-provider")
  const { supabaseAdmin } = await import("../lib/database")

  const { data: avatars } = await supabaseAdmin
    .from("virtual_avatars")
    .select("*, avatar_assets(*)")
    .order("created_at", { ascending: false })
    .limit(20)

  const avatar = (avatars || []).find(
    (a) => a.main_image_url || (a.avatar_assets as Array<{ public_url?: string }>)?.some((asset) => asset.public_url),
  )

  if (!avatar) {
    throw new Error("Nenhum avatar com imagem no banco. Crie um avatar no dashboard primeiro.")
  }

  const referenceUrl =
    avatar.main_image_url ||
    (avatar.avatar_assets as Array<{ public_url?: string }>)?.find((a) => a.public_url)?.public_url

  if (!referenceUrl) throw new Error("Avatar sem imagem de referência.")

  console.log("Avatar:", avatar.name)
  console.log("Referência:", referenceUrl.slice(0, 80))

  const url = await OpenAIProvider.generateCharacterImage(
    "speaking to camera in a modern home office, confident smile, natural daylight",
    avatar.master_prompt,
    referenceUrl,
    avatar.name,
  )

  console.log("Cena gerada:", url.slice(0, 120))
  console.log("Teste de cena com avatar OK.")
}

main().catch((err) => {
  console.error("Teste falhou:", err.message)
  process.exit(1)
})

/**
 * Smoke test do pipeline de vídeo (Fase 1)
 */
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  const { VideoDatabaseService } = await import("../lib/video-database")
  const { ScriptGenerator } = await import("../lib/pipeline/script-generator")
  const { StoryboardGenerator } = await import("../lib/pipeline/storyboard-generator")
  const { supabaseAdmin } = await import("../lib/database")

  console.log("Iniciando smoke test do pipeline...")

  const email = "smoke-test@autopostia.local"
  const { data: existing } = await supabaseAdmin.from("users").select("id").eq("email", email).maybeSingle()
  let userId = existing?.id as string | undefined

  if (!userId) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert([{ email, name: "Smoke Test", password: "unused" }])
      .select("id")
      .single()
    if (error) throw error
    userId = data.id
  }

  console.log("User:", userId)

  const avatar = await VideoDatabaseService.createAvatar(userId, {
    name: "Avatar Smoke",
    description: "Influencer realista de produtividade",
    visual_style: "realista, humano, influencer moderno",
    status: "active",
    master_prompt: "Young Brazilian productivity influencer, realistic face, 9:16 portrait",
  })
  console.log("Avatar criado:", avatar.id)

  const project = await VideoDatabaseService.createProject(userId, {
    title: "Smoke Test Video",
    prompt: "Vídeo viral sobre produtividade para empreendedores",
    avatar_id: avatar.id,
    objective: "engagement",
    target_platform: "instagram",
    duration_seconds: 30,
  })
  console.log("Projeto criado:", project.id)

  if (process.env.OPENAI_API_KEY) {
    await ScriptGenerator.generate(project.id, userId)
    console.log("Roteiro gerado")

    await StoryboardGenerator.generate(project.id, userId)
    console.log("Storyboard gerado")

    const updated = await VideoDatabaseService.getProjectById(userId, project.id)
    console.log("Status:", updated.status)
    console.log("Cenas:", updated.project_scenes?.length || 0)
  } else {
    console.warn("OPENAI_API_KEY ausente — pulando geração de roteiro/storyboard")
  }

  const projects = await VideoDatabaseService.getProjects(userId)
  const avatars = await VideoDatabaseService.getAvatars(userId)
  console.log(`Projetos: ${projects.length}, Avatares: ${avatars.length}`)
  console.log("Smoke test concluído com sucesso.")
}

main().catch((err) => {
  console.error("Smoke test falhou:", err.message)
  process.exit(1)
})

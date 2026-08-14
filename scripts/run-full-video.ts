import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  const { DatabaseService } = await import("../lib/database")
  const { VideoDatabaseService } = await import("../lib/video-database")
  const { StoryboardGenerator } = await import("../lib/pipeline/storyboard-generator")
  const { VideoPipelineService } = await import("../lib/pipeline/video-pipeline-service")

  const emails = ["demo@autopostia.com", "tiktok.sandbox@autopostia.com"]
  let user: any = null
  for (const email of emails) {
    try {
      user = await DatabaseService.getUserByEmail(email)
      if (user?.id) {
        console.log("user", email, user.id)
        break
      }
    } catch {
      /* next */
    }
  }
  if (!user?.id) throw new Error("usuário de teste não encontrado")

  const projects = await VideoDatabaseService.getProjects(user.id)
  console.log(
    "projetos",
    projects.map((p: any) => `${p.id.slice(0, 8)} ${p.status}`).join(" | "),
  )

  let project = projects.find((p: any) => p.id === "e64feb56-6efb-4202-9fdf-72e2c7720a80") || projects[0]
  if (!project) throw new Error("sem projeto")

  const full = await VideoDatabaseService.getProjectById(user.id, project.id)
  console.log("projeto", project.id, full.status, "cenas", full.project_scenes?.length || 0)

  if (!full.project_scripts?.length) {
    throw new Error("sem roteiro — gere o roteiro no app primeiro")
  }

  if (!full.project_scenes?.length) {
    console.log("gerando storyboard...")
    await StoryboardGenerator.generate(project.id, user.id)
  }

  console.log("gerando vídeo (Kling)...")
  const result = await VideoPipelineService.runFullVideoGeneration(project.id, user.id)
  console.log("OK", result)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

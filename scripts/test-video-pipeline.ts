import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  const { supabaseAdmin } = await import("../lib/database")
  const { VideoPipelineService } = await import("../lib/pipeline/video-pipeline-service")

  const { data: projects } = await supabaseAdmin
    .from("content_projects")
    .select("id, user_id, title, status, project_scenes(id, image_url, status)")
    .order("updated_at", { ascending: false })
    .limit(10)

  const project = (projects || []).find((p) =>
    (p.project_scenes as Array<{ image_url?: string }> | undefined)?.some((s) => s.image_url),
  )

  if (!project) {
    throw new Error("Nenhum projeto com cenas prontas. Gere storyboard + imagens primeiro.")
  }

  console.log("Projeto:", project.title, project.id)
  console.log("Status atual:", project.status)

  const result = await VideoPipelineService.generateSceneVideos(project.id, project.user_id)
  console.log("Vídeo final:", result.finalVideoUrl?.slice(0, 120))
  console.log("Teste de vídeo concluído.")
}

main().catch((err) => {
  console.error("Teste de vídeo falhou:", err.message)
  process.exit(1)
})

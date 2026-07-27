import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  const { isRedisAvailable } = await import("../lib/queue/index")
  const { enqueueScriptGeneration } = await import("../lib/pipeline/enqueue")
  const { supabaseAdmin } = await import("../lib/database")
  const { VideoDatabaseService } = await import("../lib/video-database")

  if (!(await isRedisAvailable())) {
    console.error("Redis indisponível")
    process.exit(1)
  }

  const { data: project } = await supabaseAdmin
    .from("content_projects")
    .select("id, user_id, title, status")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!project) {
    console.log("Redis OK — nenhum projeto no banco para testar enqueue")
    return
  }

  console.log("Projeto:", project.title, project.id)

  const result = await enqueueScriptGeneration(project.id, project.user_id)
  console.log("Modo de execução:", result.mode, result.jobId ? `(job ${result.jobId})` : "")

  if (result.mode !== "queued") {
    console.error("Esperado mode=queued com Redis ativo")
    process.exit(1)
  }

  const updated = await VideoDatabaseService.getProjectById(project.user_id, project.id)
  console.log("Status do projeto após enqueue:", updated.status)
  console.log("Enqueue via Redis OK.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import type { Job } from "bullmq"

async function bootstrap() {
  const { ScriptGenerator } = await import("@/lib/pipeline/script-generator")
  const { StoryboardGenerator } = await import("@/lib/pipeline/storyboard-generator")
  const { VideoPipelineService } = await import("@/lib/pipeline/video-pipeline-service")
  const { AvatarService } = await import("@/lib/avatars/avatar-service")
  const { createWorker, isRedisAvailable, QUEUE_NAMES } = await import("@/lib/queue/index")

  const available = await isRedisAvailable()
  if (!available) {
    console.warn("Redis indisponível — workers não iniciados. Jobs serão processados inline na API.")
    return
  }

  const workers = (
    await Promise.all([
      createWorker(QUEUE_NAMES.SCRIPT, async (job: Job) =>
        ScriptGenerator.generate(job.data.projectId, job.data.userId),
      ),
      createWorker(QUEUE_NAMES.STORYBOARD, async (job: Job) =>
        StoryboardGenerator.generate(job.data.projectId, job.data.userId),
      ),
      createWorker(QUEUE_NAMES.VIDEO, async (job: Job) =>
        VideoPipelineService.runFullVideoGeneration(job.data.projectId, job.data.userId),
      ),
      createWorker(QUEUE_NAMES.AVATAR, async (job: Job) => AvatarService.processAvatarCreation(job)),
    ])
  ).filter(Boolean)

  workers.forEach((worker) => {
    worker!.on("failed", (job, err) => {
      console.error(`Job ${job?.id} falhou:`, err.message)
    })
    worker!.on("completed", (job) => {
      console.log(`Job ${job.id} concluído (${job.name})`)
    })
  })

  console.log(`Workers iniciados: ${workers.length}`)
  console.log("Aguardando jobs...")
}

bootstrap().catch((err) => {
  console.error("Falha ao iniciar workers:", err)
  process.exit(1)
})

import { buildCuesFromScript, cuesToSrt, cuesToVtt } from "@/lib/audio/subtitle-generator"
import { StorageService } from "@/lib/storage/gcs-service"
import { VideoDatabaseService } from "@/lib/video-database"

export class SubtitlesService {
  static async generateForProject(projectId: string, userId: string) {
    const project = await VideoDatabaseService.getProjectById(userId, projectId)
    const script = await VideoDatabaseService.getLatestScript(projectId)

    if (!script) {
      throw new Error("Gere o roteiro antes das legendas")
    }

    const job = await VideoDatabaseService.createGenerationJob({
      user_id: userId,
      project_id: projectId,
      provider: "openai",
      job_type: "subtitles",
      status: "processing",
    })

    try {
      const cues = buildCuesFromScript({
        hook: script.hook,
        body: script.body,
        cta: script.cta,
        fullScript: script.full_script,
        structure: script.structure as {
          scenes?: Array<{ title?: string; description?: string; durationSeconds?: number }>
          captions?: string[]
        },
        totalDurationSeconds: project.duration_seconds || 30,
      })

      const srt = cuesToSrt(cues)
      const vtt = cuesToVtt(cues)

      const srtUploaded = await StorageService.uploadBuffer(
        Buffer.from(srt, "utf-8"),
        StorageService.buildPath(`projects/${projectId}/subtitles`, "captions.srt"),
        "text/plain",
      )

      const vttUploaded = await StorageService.uploadBuffer(
        Buffer.from(vtt, "utf-8"),
        StorageService.buildPath(`projects/${projectId}/subtitles`, "captions.vtt"),
        "text/vtt",
      )

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      const toAbsolute = (url: string) => (url.startsWith("http") ? url : `${baseUrl}${url}`)

      await VideoDatabaseService.createMediaAsset({
        user_id: userId,
        project_id: projectId,
        asset_type: "subtitle",
        storage_path: srtUploaded.storagePath,
        public_url: toAbsolute(srtUploaded.publicUrl),
        provider: "openai",
        metadata: { format: "srt" },
      })

      await VideoDatabaseService.updateProject(userId, projectId, {
        config: {
          ...(project.config as Record<string, unknown> || {}),
          subtitles: {
            srt,
            vtt,
            srtUrl: toAbsolute(srtUploaded.publicUrl),
            vttUrl: toAbsolute(vttUploaded.publicUrl),
            cueCount: cues.length,
          },
        },
      })

      await VideoDatabaseService.updateGenerationJob(job.id, {
        status: "completed",
        output_data: { cueCount: cues.length },
        completed_at: new Date().toISOString(),
      })

      return { srt, vtt, srtUrl: toAbsolute(srtUploaded.publicUrl), cueCount: cues.length }
    } catch (error) {
      await VideoDatabaseService.updateGenerationJob(job.id, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Erro nas legendas",
      })
      throw error
    }
  }
}

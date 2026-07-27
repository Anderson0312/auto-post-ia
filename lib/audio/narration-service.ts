import { StorageService } from "@/lib/storage/gcs-service"
import { VideoDatabaseService } from "@/lib/video-database"

const VOICE_MAP: Record<string, string> = {
  feminino: "nova",
  masculino: "onyx",
  neutro: "alloy",
  female: "nova",
  male: "onyx",
  warm: "shimmer",
  energetic: "echo",
}

function resolveVoice(tone?: string) {
  if (!tone) return "nova"
  const key = tone.toLowerCase()
  for (const [pattern, voice] of Object.entries(VOICE_MAP)) {
    if (key.includes(pattern)) return voice
  }
  return "nova"
}

export class NarrationService {
  static async generateForProject(projectId: string, userId: string) {
    const project = await VideoDatabaseService.getProjectById(userId, projectId)
    const script = await VideoDatabaseService.getLatestScript(projectId)

    if (!script?.full_script) {
      throw new Error("Gere o roteiro antes da narração")
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error("OPENAI_API_KEY não configurada")

    const voice = resolveVoice(project.virtual_avatars?.voice_tone || project.virtual_avatars?.personality)
    const model = process.env.OPENAI_TTS_MODEL || "tts-1"

    const job = await VideoDatabaseService.createGenerationJob({
      user_id: userId,
      project_id: projectId,
      provider: "openai",
      job_type: "narration",
      status: "processing",
      input_data: { voice, model },
    })

    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          voice,
          input: script.full_script.slice(0, 4096),
          response_format: "mp3",
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI TTS ${response.status}: ${(await response.text()).slice(0, 300)}`)
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      const uploaded = await StorageService.uploadBuffer(
        buffer,
        StorageService.buildPath(`projects/${projectId}/audio`, "narration.mp3"),
        "audio/mpeg",
      )

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      const publicUrl = uploaded.publicUrl.startsWith("http")
        ? uploaded.publicUrl
        : `${baseUrl}${uploaded.publicUrl}`

      await VideoDatabaseService.createMediaAsset({
        user_id: userId,
        project_id: projectId,
        asset_type: "audio",
        storage_path: uploaded.storagePath,
        public_url: publicUrl,
        provider: "openai",
        metadata: { voice, model, type: "narration" },
      })

      await VideoDatabaseService.updateProject(userId, projectId, {
        config: {
          ...(project.config as Record<string, unknown> || {}),
          narration: { url: publicUrl, storagePath: uploaded.storagePath, voice, model },
        },
      })

      await VideoDatabaseService.updateGenerationJob(job.id, {
        status: "completed",
        output_data: { audioUrl: publicUrl },
        completed_at: new Date().toISOString(),
      })

      return { audioUrl: publicUrl, voice }
    } catch (error) {
      await VideoDatabaseService.updateGenerationJob(job.id, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Erro na narração",
      })
      throw error
    }
  }
}

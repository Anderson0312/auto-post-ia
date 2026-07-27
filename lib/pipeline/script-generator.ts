import { OpenAIProvider } from "@/lib/providers/openai-provider"
import { isRealisticAvatar } from "@/lib/providers/provider-router"
import { ViralEngineService } from "@/lib/viral-engine/viral-engine-service"
import { VideoDatabaseService } from "@/lib/video-database"
import type { ContentObjective } from "@/lib/types/video-platform"

export class ScriptGenerator {
  static async generate(projectId: string, userId: string) {
    const project = await VideoDatabaseService.getProjectById(userId, projectId)
    const avatar = project.virtual_avatars
    const realistic = isRealisticAvatar(avatar)

    await VideoDatabaseService.updateProject(userId, projectId, { status: "scripting" })

    const job = await VideoDatabaseService.createGenerationJob({
      user_id: userId,
      project_id: projectId,
      avatar_id: project.avatar_id,
      provider: "openai",
      job_type: "script",
      status: "processing",
      input_data: { prompt: project.prompt, objective: project.objective },
    })

    try {
      const viralContext = ViralEngineService.buildScriptContext(
        project.config as Record<string, unknown> | undefined,
      )

      const script = await OpenAIProvider.generateScript({
        prompt: project.prompt || project.title,
        objective: (project.objective || "engagement") as ContentObjective,
        durationSeconds: project.duration_seconds || 30,
        platform: project.target_platform || "instagram",
        avatarName: avatar?.name,
        avatarMasterPrompt: avatar?.master_prompt,
        language: avatar?.language || "pt-BR",
        viralContext: viralContext || undefined,
      })

      await VideoDatabaseService.createProjectScript({
        project_id: projectId,
        hook: script.hook,
        body: script.body,
        cta: script.cta,
        full_script: script.fullScript,
        structure: { ...script.structure, realisticHuman: realistic },
      })

      await VideoDatabaseService.updateProject(userId, projectId, {
        status: "storyboard",
        config: { ...(project.config || {}), realisticHuman: realistic },
      })

      await VideoDatabaseService.updateGenerationJob(job.id, {
        status: "completed",
        output_data: script,
        completed_at: new Date().toISOString(),
      })

      return script
    } catch (error) {
      await VideoDatabaseService.updateGenerationJob(job.id, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Erro ao gerar roteiro",
      })
      await VideoDatabaseService.updateProject(userId, projectId, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Erro ao gerar roteiro",
      })
      throw error
    }
  }
}

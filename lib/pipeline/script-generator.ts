import { OpenAIProvider } from "@/lib/providers/openai-provider"
import { isRealisticAvatar } from "@/lib/providers/provider-router"
import { ViralEngineService } from "@/lib/viral-engine/viral-engine-service"
import { VideoDatabaseService } from "@/lib/video-database"
import { buildShortPromptConfig, shortUsesAvatar, type ShortEditableParams } from "@/lib/shorts/short-prompt-template"
import type { ContentObjective } from "@/lib/types/video-platform"

function getShortParams(config?: Record<string, unknown>): Partial<ShortEditableParams> | undefined {
  const raw = config?.shortParams || config?.PARAMETROS_EDITAVEIS
  if (!raw || typeof raw !== "object") return undefined
  return raw as Partial<ShortEditableParams>
}

export class ScriptGenerator {
  static async generate(projectId: string, userId: string) {
    const project = await VideoDatabaseService.getProjectById(userId, projectId)
    const avatar = project.virtual_avatars
    const projectConfig = (project.config || {}) as Record<string, unknown>
    const shortParams = getShortParams(projectConfig)
    const shortConfig = shortParams ? buildShortPromptConfig(shortParams) : null
    const useAvatar = Boolean(avatar) && (!shortConfig || shortUsesAvatar(shortConfig.PARAMETROS_EDITAVEIS))
    const realistic = useAvatar && isRealisticAvatar(avatar)

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
      const viralContext = ViralEngineService.buildScriptContext(projectConfig)

      const script = await OpenAIProvider.generateScript({
        prompt: project.prompt || project.title,
        objective: (project.objective || "engagement") as ContentObjective,
        durationSeconds: project.duration_seconds || 30,
        platform: project.target_platform || "instagram",
        avatarName: useAvatar ? avatar?.name : undefined,
        avatarMasterPrompt: useAvatar ? avatar?.master_prompt : undefined,
        language: avatar?.language || "pt-BR",
        viralContext: viralContext || undefined,
        shortParams,
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
        config: { ...projectConfig, realisticHuman: realistic, usesAvatar: useAvatar },
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

import { OpenAIProvider } from "@/lib/providers/openai-provider"
import { isRealisticAvatar, routeStoryboardScene } from "@/lib/providers/provider-router"
import { VideoDatabaseService } from "@/lib/video-database"
import { buildShortPromptConfig, shortUsesAvatar, type ShortEditableParams } from "@/lib/shorts/short-prompt-template"
import type { GeneratedScript } from "@/lib/providers/types"

export class StoryboardGenerator {
  static async generate(projectId: string, userId: string) {
    const project = await VideoDatabaseService.getProjectById(userId, projectId)
    const scriptRow = await VideoDatabaseService.getLatestScript(projectId)

    if (!scriptRow?.full_script) {
      throw new Error("Roteiro não encontrado. Gere o roteiro primeiro.")
    }

    const script: GeneratedScript = {
      hook: scriptRow.hook,
      body: scriptRow.body,
      cta: scriptRow.cta,
      fullScript: scriptRow.full_script,
      structure: scriptRow.structure as GeneratedScript["structure"],
    }

    const projectConfig = (project.config || {}) as Record<string, unknown>
    const shortParams = (projectConfig.shortParams || projectConfig.PARAMETROS_EDITAVEIS) as
      | Partial<ShortEditableParams>
      | undefined
    const shortConfig = shortParams ? buildShortPromptConfig(shortParams) : null
    const hasAvatar = Boolean(project.avatar_id && project.virtual_avatars)
    const useAvatar = hasAvatar && (!shortConfig || shortUsesAvatar(shortConfig.PARAMETROS_EDITAVEIS))
    const realisticHuman = useAvatar && (
      Boolean(projectConfig.realisticHuman) ||
      isRealisticAvatar(project.virtual_avatars)
    )

    await VideoDatabaseService.updateProject(userId, projectId, { status: "storyboard" })

    const job = await VideoDatabaseService.createGenerationJob({
      user_id: userId,
      project_id: projectId,
      provider: "openai",
      job_type: "storyboard",
      status: "processing",
    })

    try {
      const scenes = await OpenAIProvider.generateStoryboard({
        script,
        avatarMasterPrompt: useAvatar ? project.virtual_avatars?.master_prompt : undefined,
        realisticHuman,
        hasAvatar: useAvatar,
        shortParams,
      })

      await VideoDatabaseService.deleteScenesByProject(projectId)

      const sceneRows = scenes.map((scene) => ({
        project_id: projectId,
        scene_order: scene.sceneOrder,
        title: scene.title,
        description: scene.description,
        visual_prompt: scene.visualPrompt,
        duration_seconds: scene.durationSeconds,
        provider: routeStoryboardScene(scene),
        status: "pending",
        metadata: { realisticHuman: scene.realisticHuman },
      }))

      await VideoDatabaseService.createScenes(sceneRows)

      await VideoDatabaseService.updateProject(userId, projectId, { status: "generating_scenes" })

      await VideoDatabaseService.updateGenerationJob(job.id, {
        status: "completed",
        output_data: { scenes },
        completed_at: new Date().toISOString(),
      })

      return scenes
    } catch (error) {
      await VideoDatabaseService.updateGenerationJob(job.id, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Erro ao gerar storyboard",
      })
      await VideoDatabaseService.updateProject(userId, projectId, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Erro ao gerar storyboard",
      })
      throw error
    }
  }
}

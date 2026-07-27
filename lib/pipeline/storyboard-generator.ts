import { OpenAIProvider } from "@/lib/providers/openai-provider"
import { isRealisticAvatar, routeStoryboardScene } from "@/lib/providers/provider-router"
import { VideoDatabaseService } from "@/lib/video-database"
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

    const realisticHuman =
      Boolean((project.config as Record<string, unknown>)?.realisticHuman) ||
      isRealisticAvatar(project.virtual_avatars) ||
      Boolean(project.avatar_id)

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
        avatarMasterPrompt: project.virtual_avatars?.master_prompt,
        realisticHuman,
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

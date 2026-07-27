import { VideoDatabaseService } from "@/lib/video-database"

export class ProjectExportService {
  static async buildExportBundle(projectId: string, userId: string) {
    const project = await VideoDatabaseService.getProjectById(userId, projectId)
    const script = await VideoDatabaseService.getLatestScript(projectId)
    const scenes = await VideoDatabaseService.getScenesByProject(projectId)
    const config = (project.config || {}) as Record<string, unknown>

    return {
      exportedAt: new Date().toISOString(),
      project: {
        id: project.id,
        title: project.title,
        prompt: project.prompt,
        objective: project.objective,
        target_platform: project.target_platform,
        duration_seconds: project.duration_seconds,
        status: project.status,
      },
      script: script
        ? {
            hook: script.hook,
            body: script.body,
            cta: script.cta,
            full_script: script.full_script,
            structure: script.structure,
          }
        : null,
      scenes: scenes.map((scene) => ({
        order: scene.scene_order,
        title: scene.title,
        description: scene.description,
        duration_seconds: scene.duration_seconds,
        image_url: scene.image_url,
        video_url: scene.video_url,
        status: scene.status,
      })),
      narration: config.narration || null,
      subtitles: config.subtitles
        ? {
            srtUrl: (config.subtitles as Record<string, unknown>).srtUrl,
            vttUrl: (config.subtitles as Record<string, unknown>).vttUrl,
            cueCount: (config.subtitles as Record<string, unknown>).cueCount,
            srt: (config.subtitles as Record<string, unknown>).srt,
            vtt: (config.subtitles as Record<string, unknown>).vtt,
          }
        : null,
      avatar: project.virtual_avatars
        ? { id: project.virtual_avatars.id, name: project.virtual_avatars.name }
        : null,
    }
  }
}

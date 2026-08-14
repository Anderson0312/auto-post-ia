import { GeminiProvider, preferGeminiVideoProvider } from "@/lib/providers/gemini-provider"
import { OpenAIProvider } from "@/lib/providers/openai-provider"
import { getVideoProvider, isRealisticAvatar } from "@/lib/providers/provider-router"
import { StorageService } from "@/lib/storage/gcs-service"
import { VideoDatabaseService } from "@/lib/video-database"
import { SHORT_ASPECT_RATIO } from "@/lib/short-form"
import type { AIProvider } from "@/lib/types/video-platform"

function toAbsoluteMediaUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  if (url.startsWith("/")) {
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}${url}`
  }
  return url
}
function getAvatarFallbackImage(project: Awaited<ReturnType<typeof VideoDatabaseService.getProjectById>>) {
  const avatar = project.virtual_avatars
  if (!avatar) return null
  if (avatar.main_image_url) return avatar.main_image_url
  const assets = avatar.avatar_assets as Array<{ public_url?: string }> | undefined
  return assets?.find((a) => a.public_url)?.public_url || null
}

async function persistSceneImage(
  sourceUrl: string,
  projectId: string,
  sceneOrder: number,
) {
  const storagePath = StorageService.buildPath(
    `projects/${projectId}/scenes`,
    `scene-${sceneOrder}.png`,
  )
  return StorageService.persistExistingImage(sourceUrl, storagePath)
}

async function generateSceneImageWithFallback(
  project: Awaited<ReturnType<typeof VideoDatabaseService.getProjectById>>,
  scene: { visual_prompt?: string; scene_order: number },
) {
  const storagePath = StorageService.buildPath(
    `projects/${project.id}/scenes`,
    `scene-${scene.scene_order}.png`,
  )

  const avatar = project.virtual_avatars
  const referenceImageUrl = getAvatarFallbackImage(project)

  try {
    const tempUrl = await OpenAIProvider.generateCharacterImage(
      scene.visual_prompt || project.prompt || "social media scene",
      avatar?.master_prompt,
      referenceImageUrl,
      avatar?.name,
    )
    return {
      ...(await StorageService.uploadFromUrl(tempUrl, storagePath)),
      source: "openai" as const,
    }
  } catch (dalleError) {
    const fallbackUrl = getAvatarFallbackImage(project)
    if (!fallbackUrl) throw dalleError

    console.warn(
      `Geração de cena ${scene.scene_order} falhou, usando imagem do avatar:`,
      dalleError instanceof Error ? dalleError.message : dalleError,
    )

    return {
      ...(await persistSceneImage(fallbackUrl, project.id, scene.scene_order)),
      source: "avatar_fallback" as const,
    }
  }
}

async function pollVideoJob(
  provider: AIProvider,
  externalJobId: string,
  maxAttempts = 30,
  delayMs = 5000,
) {
  const videoProvider = getVideoProvider(provider)
  if (!videoProvider) throw new Error(`Provider ${provider} não suporta vídeo`)

  for (let i = 0; i < maxAttempts; i++) {
    const status = await videoProvider.getJobStatus(externalJobId)
    if (status.status === "completed") return status
    if (status.status === "failed") throw new Error(status.errorMessage || "Falha na geração de vídeo")
    await new Promise((r) => setTimeout(r, delayMs))
  }

  throw new Error("Timeout aguardando geração de vídeo")
}

export class VideoPipelineService {
  static async generateSceneImages(projectId: string, userId: string) {
    const project = await VideoDatabaseService.getProjectById(userId, projectId)
    const scenes = await VideoDatabaseService.getScenesByProject(projectId)

    for (const scene of scenes) {
      if (scene.image_url && scene.status !== "failed") {
        continue
      }

      await VideoDatabaseService.updateScene(scene.id, { status: "generating_image" })

      const job = await VideoDatabaseService.createGenerationJob({
        user_id: userId,
        project_id: projectId,
        scene_id: scene.id,
        provider: "openai",
        job_type: "scene_image",
        status: "processing",
        input_data: { visualPrompt: scene.visual_prompt },
      })

      try {
        const uploaded = await generateSceneImageWithFallback(project, scene)

        await VideoDatabaseService.updateScene(scene.id, {
          image_url: uploaded.publicUrl,
          status: "image_ready",
          metadata: { ...(scene.metadata || {}), imageSource: uploaded.source },
        })

        await VideoDatabaseService.createMediaAsset({
          user_id: userId,
          project_id: projectId,
          asset_type: "image",
          storage_path: uploaded.storagePath,
          public_url: uploaded.publicUrl,
          provider: uploaded.source === "openai" ? "openai" : "avatar",
          metadata: { scene_id: scene.id, source: uploaded.source },
        })

        await VideoDatabaseService.updateGenerationJob(job.id, {
          status: "completed",
          output_data: { imageUrl: uploaded.publicUrl, source: uploaded.source },
          completed_at: new Date().toISOString(),
        })

        // Evita rate limit da OpenAI entre cenas
        await new Promise((r) => setTimeout(r, 1500))
      } catch (error) {
        await VideoDatabaseService.updateGenerationJob(job.id, {
          status: "failed",
          error_message: error instanceof Error ? error.message : "Erro na imagem da cena",
        })
        await VideoDatabaseService.updateScene(scene.id, { status: "failed" })
      }
    }
  }

  static async generateSceneVideos(projectId: string, userId: string) {
    const project = await VideoDatabaseService.getProjectById(userId, projectId)
    const scenes = await VideoDatabaseService.getScenesByProject(projectId)
    if (!scenes.length) {
      throw new Error("Gere as cenas antes do vídeo (botão Gerar cenas).")
    }

    await VideoDatabaseService.updateProject(userId, projectId, { status: "rendering" })

    let firstVideoUrl: string | null = null
    let successfulVideos = 0
    const videoErrors: string[] = []

    for (const scene of scenes) {
      if (!scene.image_url) continue
      if (scene.video_url && scene.status === "completed") {
        if (!firstVideoUrl) firstVideoUrl = scene.video_url
        successfulVideos += 1
        continue
      }

      const provider = (scene.provider === "gemini" ? "kling" : scene.provider || "kling") as AIProvider
      const videoProvider = getVideoProvider(provider)

      if (!videoProvider) {
        videoErrors.push(`Cena ${scene.scene_order + 1}: provider de vídeo indisponível`)
        continue
      }

      await VideoDatabaseService.updateScene(scene.id, { status: "generating_video" })

      const job = await VideoDatabaseService.createGenerationJob({
        user_id: userId,
        project_id: projectId,
        scene_id: scene.id,
        provider,
        job_type: "video",
        status: "processing",
        input_data: {
          prompt: scene.visual_prompt,
          imageUrl: toAbsoluteMediaUrl(scene.image_url),
          durationSeconds: scene.duration_seconds,
        },
      })

      try {
        const videoInput = {
          prompt: scene.visual_prompt,
          imageUrl: toAbsoluteMediaUrl(scene.image_url),
          durationSeconds: scene.duration_seconds,
          aspectRatio: SHORT_ASPECT_RATIO,
          avatarMasterPrompt: project.virtual_avatars?.master_prompt,
          realisticHuman: Boolean((scene.metadata as Record<string, unknown>)?.realisticHuman),
        }

        let activeProvider = provider
        let started = await videoProvider.generateVideo(videoInput)

        if (started.status === "failed") {
          const otherName = activeProvider === "kling" ? "gemini" : "kling"
          const billingDead = /prepayment|billing|depleted|quota/i.test(started.errorMessage || "")
          if (!(otherName === "gemini" && billingDead)) {
            const other = getVideoProvider(otherName)
            if (other) {
              console.warn(`${activeProvider} falhou, tentando ${otherName}:`, started.errorMessage)
              activeProvider = otherName
              started = await other.generateVideo(videoInput)
            }
          }
        }

        if (started.status === "failed") {
          throw new Error(started.errorMessage || "Falha ao iniciar vídeo")
        }

        let outputUrl = started.outputUrl

        if (started.externalJobId && started.status === "processing") {
          await VideoDatabaseService.updateGenerationJob(job.id, {
            external_job_id: started.externalJobId,
            status: "processing",
          })
          const completed = await pollVideoJob(activeProvider, started.externalJobId)
          outputUrl = completed.outputUrl
        }

        if (!outputUrl) {
          throw new Error("Provider não retornou URL de vídeo")
        }

        const storagePath = StorageService.buildPath(
          `projects/${projectId}/videos`,
          `scene-${scene.scene_order}.mp4`,
        )

        const uploaded =
          activeProvider === "gemini"
            ? await new GeminiProvider().downloadVideo(outputUrl, storagePath)
                .then((publicUrl) => ({ storagePath, publicUrl }))
            : await StorageService.uploadFromUrl(outputUrl, storagePath)

        await VideoDatabaseService.updateScene(scene.id, {
          video_url: uploaded.publicUrl,
          status: "completed",
        })

        await VideoDatabaseService.createMediaAsset({
          user_id: userId,
          project_id: projectId,
          asset_type: "video",
          storage_path: uploaded.storagePath,
          public_url: uploaded.publicUrl,
          provider: activeProvider,
          metadata: { scene_id: scene.id },
        })

        if (!firstVideoUrl) firstVideoUrl = uploaded.publicUrl
        successfulVideos += 1

        await VideoDatabaseService.updateGenerationJob(job.id, {
          status: "completed",
          output_data: { videoUrl: uploaded.publicUrl },
          completed_at: new Date().toISOString(),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro no vídeo da cena"
        videoErrors.push(`Cena ${scene.scene_order + 1}: ${message}`)
        await VideoDatabaseService.updateGenerationJob(job.id, {
          status: "failed",
          error_message: message,
        })
        await VideoDatabaseService.updateScene(scene.id, {
          status: "failed",
          metadata: {
            ...(scene.metadata || {}),
            fallback: "video_failed",
            videoError: message,
          },
        })
      }
    }

    if (successfulVideos === 0) {
      await VideoDatabaseService.updateProject(userId, projectId, {
        status: "failed",
        error_message: videoErrors[0] || "Nenhuma cena gerou vídeo. Verifique créditos Kling (pacote API) ou billing Gemini Veo.",
        thumbnail_url: scenes[0]?.image_url || null,
      })
      throw new Error(videoErrors[0] || "Falha na geração de vídeo curto")
    }

    await VideoDatabaseService.updateProject(userId, projectId, {
      status: "ready",
      final_video_url: firstVideoUrl,
      thumbnail_url: scenes[0]?.image_url || null,
      error_message: videoErrors.length ? videoErrors.join(" | ") : null,
    })

    return { finalVideoUrl: firstVideoUrl }
  }

  static async runFullVideoGeneration(projectId: string, userId: string) {
    await this.generateSceneImages(projectId, userId)
    return this.generateSceneVideos(projectId, userId)
  }
}

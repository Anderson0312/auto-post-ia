import { OpenAIProvider } from "@/lib/providers/openai-provider"
import { StorageService } from "@/lib/storage/gcs-service"
import { VideoDatabaseService } from "@/lib/video-database"
import { enqueueAvatarCreation } from "@/lib/pipeline/enqueue"
import type { AvatarEditableParams } from "@/lib/avatars/selfie-prompt-template"
import {
  buildAvatarDescription,
  buildAvatarPromptConfig,
  parseApparentAge,
  serializeAvatarPromptConfig,
} from "@/lib/avatars/selfie-prompt-template"
import type { Job } from "bullmq"

export class AvatarService {
  static async createFromDescription(
    userId: string,
    data: {
      name: string
      description?: string
      visualStyle?: string
      niche?: string
      personality?: string
      gender?: string
      nationality?: string
      language?: string
      avatarParams?: Partial<AvatarEditableParams>
    },
  ) {
    const hasStructuredParams = Boolean(data.avatarParams && Object.keys(data.avatarParams).length > 0)
    const config = hasStructuredParams ? buildAvatarPromptConfig(data.avatarParams) : null
    const params = config?.PARAMETROS_EDITAVEIS
    const description =
      data.description?.trim() ||
      (params ? buildAvatarDescription(params, data.name) : "")

    const avatar = await VideoDatabaseService.createAvatar(userId, {
      name: data.name,
      description,
      visual_style: data.visualStyle || (hasStructuredParams ? "selfie fotorrealista com smartphone" : undefined),
      niche: data.niche,
      personality: data.personality || params?.expressao,
      gender: data.gender || params?.genero,
      nationality: data.nationality || params?.etnia,
      apparent_age: params ? parseApparentAge(params.idade) : undefined,
      language: data.language || "pt-BR",
      master_prompt: config ? serializeAvatarPromptConfig(config) : undefined,
      default_clothing: params?.roupa,
      default_expressions: params?.expressao,
      status: "processing",
    })

    await enqueueAvatarCreation(userId, avatar.id)

    return avatar
  }

  static async importFromImages(
    userId: string,
    data: {
      name: string
      description?: string
      images: Array<{ base64: string; mimeType: string; filename: string }>
    },
  ) {
    const avatar = await VideoDatabaseService.createAvatar(userId, {
      name: data.name,
      description: data.description || "",
      status: "processing",
    })

    let mainImageUrl: string | undefined

    for (const [index, image] of data.images.entries()) {
      const buffer = Buffer.from(image.base64, "base64")
      const storagePath = StorageService.buildPath(
        `avatars/${avatar.id}`,
        image.filename || `import-${index}.png`,
      )
      const uploaded = await StorageService.uploadBuffer(buffer, storagePath, image.mimeType)

      await VideoDatabaseService.createAvatarAsset({
        avatar_id: avatar.id,
        user_id: userId,
        asset_type: index === 0 ? "imported" : "reference",
        storage_path: uploaded.storagePath,
        public_url: uploaded.publicUrl,
      })

      if (index === 0) mainImageUrl = uploaded.publicUrl
    }

    const identity = await OpenAIProvider.generateAvatarIdentity({
      name: data.name,
      description: data.description || "Avatar importado pelo usuário",
    })

    const updated = await VideoDatabaseService.updateAvatar(userId, avatar.id, {
      master_prompt: identity.masterPrompt,
      personality: identity.personality,
      visual_style: identity.visualStyle,
      default_clothing: identity.defaultClothing,
      default_expressions: identity.defaultExpressions,
      main_image_url: mainImageUrl,
      status: "active",
    })

    return updated
  }

  static async processAvatarCreation(job: Job | { data: Record<string, unknown> }) {
    const { userId, avatarId } = job.data as { userId: string; avatarId: string }
    const avatar = await VideoDatabaseService.getAvatarById(userId, avatarId)

    const genJob = await VideoDatabaseService.createGenerationJob({
      user_id: userId,
      avatar_id: avatarId,
      provider: "kling",
      job_type: "avatar_identity",
      status: "processing",
    })

    try {
      const storedConfig = avatar.master_prompt
        ? (() => {
            try {
              return JSON.parse(avatar.master_prompt)
            } catch {
              return null
            }
          })()
        : null

      const identity = storedConfig?.PARAMETROS_EDITAVEIS
        ? await OpenAIProvider.generateAvatarIdentity({
            name: avatar.name,
            description: avatar.description,
            niche: avatar.niche,
            personality: avatar.personality,
            avatarParams: storedConfig.PARAMETROS_EDITAVEIS,
          })
        : await OpenAIProvider.generateAvatarIdentity({
            name: avatar.name,
            description: avatar.description,
            visualStyle: avatar.visual_style,
            niche: avatar.niche,
            personality: avatar.personality,
          })

      const usesStructuredPrompt = Boolean(storedConfig?.PARAMETROS_EDITAVEIS)

      const tempImageUrl = await OpenAIProvider.generateCharacterImage(
        identity.imagePrompt,
        identity.masterPrompt,
        undefined,
        avatar.name,
        { directPrompt: usesStructuredPrompt },
      )
      const uploaded = await StorageService.uploadFromUrl(
        tempImageUrl,
        StorageService.buildPath(`avatars/${avatarId}`, "main.png"),
      )

      await VideoDatabaseService.createAvatarAsset({
        avatar_id: avatarId,
        user_id: userId,
        asset_type: "generated",
        storage_path: uploaded.storagePath,
        public_url: uploaded.publicUrl,
      })

      const variationUrl = await OpenAIProvider.generateCharacterImage(
        usesStructuredPrompt
          ? "slight natural smile, slightly different selfie angle, same person and appearance"
          : `${identity.imagePrompt}, different angle, smiling`,
        identity.masterPrompt,
        uploaded.publicUrl,
        avatar.name,
      )
      const variationUploaded = await StorageService.uploadFromUrl(
        variationUrl,
        StorageService.buildPath(`avatars/${avatarId}`, "variation-1.png"),
      )

      await VideoDatabaseService.createAvatarAsset({
        avatar_id: avatarId,
        user_id: userId,
        asset_type: "variation",
        storage_path: variationUploaded.storagePath,
        public_url: variationUploaded.publicUrl,
      })

      await VideoDatabaseService.updateAvatar(userId, avatarId, {
        master_prompt: identity.masterPrompt,
        personality: identity.personality,
        visual_style: identity.visualStyle,
        default_clothing: identity.defaultClothing,
        default_expressions: identity.defaultExpressions,
        main_image_url: uploaded.publicUrl,
        status: "active",
      })

      await VideoDatabaseService.updateGenerationJob(genJob.id, {
        status: "completed",
        output_data: { mainImageUrl: uploaded.publicUrl },
        completed_at: new Date().toISOString(),
      })
    } catch (error) {
      await VideoDatabaseService.updateGenerationJob(genJob.id, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Erro ao criar avatar",
      })
      await VideoDatabaseService.updateAvatar(userId, avatarId, { status: "failed" })
      throw error
    }
  }
}

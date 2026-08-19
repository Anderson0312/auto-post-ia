import type { AIProvider, GenerationJobResult, VideoGenerationInput } from "@/lib/types/video-platform"

export interface VideoProvider {
  readonly name: AIProvider
  generateVideo(input: VideoGenerationInput): Promise<GenerationJobResult>
  getJobStatus(externalJobId: string): Promise<GenerationJobResult>
}

import type { AvatarEditableParams } from "@/lib/avatars/selfie-prompt-template"

export interface AvatarIdentityInput {
  name: string
  description: string
  visualStyle?: string
  niche?: string
  personality?: string
  avatarParams?: Partial<AvatarEditableParams>
}

export interface GeneratedAvatarIdentity {
  masterPrompt: string
  personality: string
  visualStyle: string
  defaultClothing: string
  defaultExpressions: string
  imagePrompt: string
}

export interface GeneratedScript {
  hook: string
  body: string
  cta: string
  fullScript: string
  structure: {
    scenes: Array<{ title: string; description: string; durationSeconds: number }>
    captions: string[]
    pacing: string
  }
}

export interface StoryboardScene {
  sceneOrder: number
  title: string
  description: string
  visualPrompt: string
  durationSeconds: number
  provider: AIProvider
  realisticHuman: boolean
}

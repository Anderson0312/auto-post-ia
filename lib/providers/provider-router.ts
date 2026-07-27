import type { AIProvider } from "@/lib/types/video-platform"
import { GeminiProvider, preferGeminiVideoProvider } from "@/lib/providers/gemini-provider"
import { KlingProvider } from "@/lib/providers/kling-provider"
import type { StoryboardScene } from "@/lib/providers/types"
import type { VideoProvider } from "@/lib/providers/types"

export function selectVideoProvider(params: {
  realisticHuman?: boolean
  hasAvatar?: boolean
  animatedOrEducational?: boolean
  providerHint?: AIProvider
}): AIProvider {
  if (preferGeminiVideoProvider()) {
    return "gemini"
  }

  if (params.providerHint && params.providerHint !== "openai") {
    return params.providerHint
  }

  if (params.realisticHuman || params.hasAvatar) {
    return "kling"
  }

  if (params.animatedOrEducational) {
    return "gemini"
  }

  return "gemini"
}

export function getVideoProvider(provider: AIProvider): VideoProvider | null {
  switch (provider) {
    case "kling":
      return new KlingProvider()
    case "gemini":
      return new GeminiProvider()
    default:
      return null
  }
}

export function routeStoryboardScene(scene: StoryboardScene): AIProvider {
  if (preferGeminiVideoProvider()) {
    return "gemini"
  }

  if (scene.realisticHuman || scene.provider === "kling") {
    return "kling"
  }
  return "gemini"
}

export function isRealisticAvatar(avatar?: {
  visual_style?: string
  master_prompt?: string
  description?: string
} | null): boolean {
  if (!avatar) return false
  const text = `${avatar.visual_style || ""} ${avatar.master_prompt || ""} ${avatar.description || ""}`.toLowerCase()
  const realisticKeywords = ["realista", "realistic", "humano", "human", "influencer", "rosto", "face", "portrait"]
  return realisticKeywords.some((k) => text.includes(k))
}

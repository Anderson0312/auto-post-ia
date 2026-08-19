import { getMasterPromptIdentitySummary } from "@/lib/avatars/selfie-prompt-template"
import { buildShortSceneVisualPrompt, isAdultSensualCategory } from "@/lib/shorts/short-prompt-template"

export function buildSceneVisualPrompt(params: {
  sceneDescription: string
  avatarName?: string
  masterPrompt?: string
  visualStyle?: string
  formatoVisual?: string
  publicoAlvo?: string
  categoria?: string
  useAvatar?: boolean
}): string {
  const scene = params.sceneDescription.trim()
  const hasIdentity = Boolean(params.masterPrompt?.trim() || params.avatarName?.trim())
  const useAvatar = params.useAvatar ?? hasIdentity
  const sensual = isAdultSensualCategory(params.categoria)

  if (!useAvatar || !hasIdentity) {
    return buildShortSceneVisualPrompt({
      sceneDescription: scene,
      visualStyle: params.visualStyle,
      formatoVisual: params.formatoVisual,
      publicoAlvo: params.publicoAlvo,
      categoria: params.categoria,
    })
  }

  const identity = getMasterPromptIdentitySummary(params.masterPrompt, params.avatarName)

  return [
    `Same person as reference avatar: ${identity}.`,
    "Preserve exact face, hair color, hairstyle, skin tone, age, and body type.",
    sensual
      ? "The person is clearly an adult 21+. Sensual, suggestive pose and gaze, warm intimate lighting, fitted clothing or tasteful lingerie. NO explicit sex, NO genitals, NO pornography, NO minors."
      : "Only change pose, expression, outfit details, and background as described.",
    `Scene: ${scene}`,
    "Vertical 9:16 portrait, photorealistic, cinematic lighting, social media quality, no text overlay.",
  ].join(" ")
}

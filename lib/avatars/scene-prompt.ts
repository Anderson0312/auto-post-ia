export function buildSceneVisualPrompt(params: {
  sceneDescription: string
  avatarName?: string
  masterPrompt?: string
}): string {
  const identity = params.masterPrompt?.trim() || params.avatarName?.trim() || "the selected avatar"
  const scene = params.sceneDescription.trim()

  return [
    `Same person as reference avatar: ${identity}.`,
    "Preserve exact face, hair color, hairstyle, skin tone, age, and body type.",
    "Only change pose, expression, outfit details, and background as described.",
    `Scene: ${scene}`,
    "Vertical 9:16 portrait, photorealistic, cinematic lighting, social media quality, no text overlay.",
  ].join(" ")
}

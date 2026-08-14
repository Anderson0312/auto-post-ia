/** Vídeo curto é o produto principal. Desligue só com =false. */
export function isVideoGenerationEnabled() {
  return process.env.VIDEO_GENERATION_ENABLED !== "false"
}

export function isPublicVideoGenerationEnabled() {
  return process.env.NEXT_PUBLIC_VIDEO_GENERATION_ENABLED !== "false"
}

/** Presets do produto: vídeo curto vertical (TikTok / Shorts / Reels). */

export const SHORT_FORM_PLATFORMS = [
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube Shorts" },
  { id: "instagram", label: "Instagram Reels" },
  { id: "facebook", label: "Facebook Reels" },
] as const

export const DEFAULT_SHORT_PLATFORM = "tiktok"
export const DEFAULT_SHORT_DURATION = 21
export const MIN_SHORT_DURATION = 8
export const MAX_SHORT_DURATION = 60
export const SHORT_ASPECT_RATIO = "9:16"

export const SHORT_FORM_SCRIPT_RULES = `
Formato: vídeo curto vertical ${SHORT_ASPECT_RATIO} (TikTok / YouTube Shorts / Reels).
Regras extras:
1. Hook nos primeiros 1–3 segundos (texto na tela + fala)
2. Ritmo rápido, cortes a cada 3–8s, sem enrolação
3. Linguagem falada, frases curtas
4. CTA no final (seguir, comentar, salvar ou link na bio)
5. 3–5 cenas; soma das durações = duração total
6. Pense em loop: o último segundo pode reconectar no início
7. Não escreva para feed estático — o entregável é um SHORT
`

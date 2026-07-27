export interface SubtitleCue {
  index: number
  startMs: number
  endMs: number
  text: string
}

function padTime(ms: number) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const msPart = ms % 1000
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(msPart).padStart(3, "0")}`
}

function padVttTime(ms: number) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const msPart = ms % 1000
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(msPart).padStart(3, "0")}`
}

export function buildCuesFromScript(params: {
  hook?: string
  body?: string
  cta?: string
  fullScript?: string
  structure?: {
    scenes?: Array<{ title?: string; description?: string; durationSeconds?: number }>
    captions?: string[]
  }
  totalDurationSeconds?: number
}): SubtitleCue[] {
  const scenes = params.structure?.scenes || []
  const captions = params.structure?.captions?.filter(Boolean) || []

  if (scenes.length > 0) {
    let cursor = 0
    return scenes.map((scene, index) => {
      const durationMs = (scene.durationSeconds || 5) * 1000
      const cue: SubtitleCue = {
        index: index + 1,
        startMs: cursor,
        endMs: cursor + durationMs,
        text: captions[index] || scene.description || scene.title || "",
      }
      cursor += durationMs
      return cue
    }).filter((c) => c.text.trim())
  }

  if (captions.length > 0) {
    const totalMs = (params.totalDurationSeconds || 30) * 1000
    const slot = Math.floor(totalMs / captions.length)
    return captions.map((text, index) => ({
      index: index + 1,
      startMs: index * slot,
      endMs: index === captions.length - 1 ? totalMs : (index + 1) * slot,
      text,
    }))
  }

  const text = params.fullScript || [params.hook, params.body, params.cta].filter(Boolean).join(" ")
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
  const totalMs = (params.totalDurationSeconds || 30) * 1000
  const slot = Math.max(1500, Math.floor(totalMs / Math.max(sentences.length, 1)))

  return sentences.map((sentence, index) => ({
    index: index + 1,
    startMs: index * slot,
    endMs: Math.min(totalMs, (index + 1) * slot),
    text: sentence,
  }))
}

export function cuesToSrt(cues: SubtitleCue[]) {
  return cues
    .map(
      (cue) =>
        `${cue.index}\n${padTime(cue.startMs)} --> ${padTime(cue.endMs)}\n${cue.text}\n`,
    )
    .join("\n")
}

export function cuesToVtt(cues: SubtitleCue[]) {
  const body = cues
    .map((cue) => `${padVttTime(cue.startMs)} --> ${padVttTime(cue.endMs)}\n${cue.text}`)
    .join("\n\n")
  return `WEBVTT\n\n${body}\n`
}

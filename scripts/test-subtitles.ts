import { buildCuesFromScript, cuesToSrt, cuesToVtt } from "../lib/audio/subtitle-generator"

function main() {
  const cues = buildCuesFromScript({
    hook: "Você está perdendo tempo todo dia.",
    body: "Três hábitos mudam tudo em 15 minutos.",
    cta: "Salva este vídeo e começa hoje.",
    structure: {
      scenes: [
        { title: "Hook", description: "Você está perdendo tempo todo dia.", durationSeconds: 3 },
        { title: "Dica 1", description: "Liste suas 3 prioridades.", durationSeconds: 8 },
        { title: "CTA", description: "Salva e começa hoje.", durationSeconds: 4 },
      ],
      captions: ["Pare de perder tempo", "3 prioridades por dia", "Salva e começa"],
    },
    totalDurationSeconds: 15,
  })

  const srt = cuesToSrt(cues)
  const vtt = cuesToVtt(cues)

  if (cues.length !== 3) throw new Error(`Esperado 3 cues, recebeu ${cues.length}`)
  if (!srt.includes("WEBVTT") && !srt.includes("00:00:00")) throw new Error("SRT inválido")
  if (!vtt.startsWith("WEBVTT")) throw new Error("VTT inválido")

  console.log("Cues:", cues.length)
  console.log("SRT preview:\n", srt.split("\n").slice(0, 6).join("\n"))
  console.log("Teste legendas OK.")
}

main()

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  const { ViralEngineService } = await import("../lib/viral-engine/viral-engine-service")

  const ideas = await ViralEngineService.generateIdeas({
    niche: "produtividade para empreendedores",
    platform: "instagram",
    objective: "engagement",
    count: 3,
  })

  console.log("Ideias:", ideas.length)
  console.log("Primeira:", ideas[0]?.title, "— score", ideas[0]?.viralScore)

  const brief = await ViralEngineService.buildGuidedBrief({
    answers: {
      niche: "fitness em casa",
      audience: "mulheres 25-40",
      painPoint: "falta de tempo",
      desiredOutcome: "rotina de 15 min",
      tone: "motivacional",
    },
    platform: "tiktok",
    objective: "followers",
  })

  console.log("Briefing:", brief.suggestedTitle)

  const trends = await ViralEngineService.getTrendingTopics({
    niche: "fitness em casa",
    platform: "tiktok",
    objective: "followers",
    count: 3,
  })
  console.log("Tendências:", trends.length, "— primeira:", trends[0]?.title)

  const ctx = ViralEngineService.buildScriptContext({
    viralIdea: ideas[0],
    trendsContext: trends[0] ? `${trends[0].title} — ${trends[0].format}` : undefined,
  })
  console.log("Contexto roteiro:", ctx.slice(0, 80) + "...")

  console.log("Teste Viral Engine OK.")
}

main().catch((err) => {
  console.error("Teste falhou:", err.message)
  process.exit(1)
})

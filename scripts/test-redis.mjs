import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  const { isRedisAvailable, getQueue, QUEUE_NAMES } = await import("../lib/queue/index")

  console.log("REDIS_URL configurada:", Boolean(process.env.REDIS_URL))

  const available = await isRedisAvailable()
  console.log("Redis disponível:", available)

  if (!available) {
    process.exit(1)
  }

  const queue = await getQueue(QUEUE_NAMES.SCRIPT)
  if (!queue) {
    console.error("Falha ao obter fila")
    process.exit(1)
  }

  const job = await queue.add(QUEUE_NAMES.SCRIPT, {
    test: true,
    projectId: "test",
    userId: "test",
  })

  console.log("Job enfileirado:", job.id, "na fila", QUEUE_NAMES.SCRIPT)

  const counts = await queue.getJobCounts()
  console.log("Contagem da fila:", counts)

  await job.remove().catch(() => {
    console.log("Job de teste em processamento pelo worker — cleanup ignorado.")
  })
  console.log("Redis OK.")
}

main().catch((err) => {
  console.error("Teste Redis falhou:", err.message)
  process.exit(1)
})

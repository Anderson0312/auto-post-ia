import { Queue, Worker, type Job } from "bullmq"
import IORedis from "ioredis"

// BullMQ não aceita ":" nos nomes das filas
export const QUEUE_NAMES = {
  SCRIPT: "pipeline-script",
  STORYBOARD: "pipeline-storyboard",
  SCENE_IMAGE: "pipeline-scene-image",
  VIDEO: "pipeline-video",
  AVATAR: "pipeline-avatar",
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

let connection: IORedis | null = null
let redisAvailability: boolean | null = null
const queueCache = new Map<string, Queue>()

function createRedisConnection() {
  const redis = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  })

  redis.on("error", () => {
    // Evita spam de "Unhandled error event" no console
  })

  return redis
}

export async function isRedisAvailable(): Promise<boolean> {
  if (!process.env.REDIS_URL) return false
  if (redisAvailability === false) return false
  if (redisAvailability === true) return true

  try {
    if (!connection) {
      connection = createRedisConnection()
    }
    if (connection.status !== "ready") {
      await connection.connect()
    }
    await connection.ping()
    redisAvailability = true
    return true
  } catch {
    redisAvailability = false
    try {
      connection?.disconnect()
    } catch {
      // ignore
    }
    connection = null
    queueCache.clear()
    return false
  }
}

export function getRedisConnection() {
  return connection
}

export async function getQueue(name: QueueName) {
  const available = await isRedisAvailable()
  if (!available) return null

  if (!queueCache.has(name)) {
    queueCache.set(
      name,
      new Queue(name, {
        connection: connection!,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      }),
    )
  }
  return queueCache.get(name)!
}

export async function enqueuePipelineJob(
  queueName: QueueName,
  data: Record<string, unknown>,
  processor: (job: Job) => Promise<void>,
) {
  try {
    const queue = await getQueue(queueName)

    if (!queue) {
      await processor({ data, id: "inline", name: queueName } as Job)
      return { mode: "inline" as const }
    }

    const job = await queue.add(queueName, data)
    return { mode: "queued" as const, jobId: job.id }
  } catch (error) {
    console.warn(`Fila ${queueName} indisponível, executando inline:`, error)
    redisAvailability = false
    await processor({ data, id: "inline", name: queueName } as Job)
    return { mode: "inline" as const }
  }
}

export async function createWorker(queueName: QueueName, processor: (job: Job) => Promise<void>) {
  const available = await isRedisAvailable()
  if (!available || !connection) return null

  return new Worker(queueName, processor, { connection, concurrency: 2 })
}

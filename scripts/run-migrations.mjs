import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"
import pg from "pg"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, "..", ".env.local") })

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL

if (!connectionString) {
  console.error("Defina POSTGRES_URL_NON_POOLING no .env.local")
  process.exit(1)
}

const migrationFiles = [
  "01-create-database-schema.sql",
  "03-add-password-column.sql",
  "04-add-password-reset-tokens-table.sql",
  "05-add-ai-configuration-tables.sql",
  "05b-alter-ai-configurations.sql",
  "06-add-post-logs-table.sql",
  "07-video-platform-schema.sql",
]

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query("SELECT filename FROM schema_migrations")
  return new Set(rows.map((r) => r.filename))
}

async function backfillExistingMigrations(client) {
  const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM schema_migrations")
  if (rows[0].count > 0) return

  const { rows: existing } = await client.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
    LIMIT 1
  `)

  if (existing.length === 0) return

  for (const file of migrationFiles) {
    await client.query(
      "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
      [file],
    )
  }

  const { rows: videoTable } = await client.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'virtual_avatars'
    LIMIT 1
  `)
  if (videoTable.length === 0) {
    await client.query("DELETE FROM schema_migrations WHERE filename = '07-video-platform-schema.sql'")
  }
}

async function run() {
  const normalizedConnectionString = connectionString
    .replace(/[?&]sslmode=[^&]*/g, "")
    .replace(/\?$/, "")

  const client = new pg.Client({
    connectionString: normalizedConnectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log("Conectado ao banco.")

  try {
    await ensureMigrationsTable(client)
    await backfillExistingMigrations(client)
    const applied = await getAppliedMigrations(client)

    for (const file of migrationFiles) {
      if (applied.has(file)) {
        console.log(`Pulando ${file} (já aplicada)`)
        continue
      }

      const filePath = path.join(__dirname, file)
      if (!fs.existsSync(filePath)) {
        console.log(`Ignorando ${file} (arquivo não encontrado)`)
        continue
      }

      const sql = fs.readFileSync(filePath, "utf8")
      console.log(`Executando ${file}...`)
      await client.query(sql)
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file])
      console.log(`OK: ${file}`)
    }

    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    console.log("\nTabelas no banco:")
    for (const row of rows) {
      console.log(`  - ${row.table_name}`)
    }
  } finally {
    await client.end()
  }
}

run().catch((error) => {
  console.error("Erro ao executar migrações:", error.message)
  process.exit(1)
})

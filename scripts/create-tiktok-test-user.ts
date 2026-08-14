import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import bcrypt from "bcryptjs"

const EMAIL = "tiktok.sandbox@autopostia.com"
const NAME = "Conta Teste TikTok"
const PASSWORD = "AutoPostIA#TikTok26"

async function upsertTestUser(
  DatabaseService: typeof import("../lib/database").DatabaseService,
  email: string,
  name: string,
  password: string,
) {
  const hashed = await bcrypt.hash(password, 12)
  let user: { id: string } | null = null
  try {
    user = await DatabaseService.getUserByEmail(email)
  } catch {
    user = null
  }

  if (user?.id) {
    await DatabaseService.updateUser(user.id, { password: hashed, name })
    console.log("Atualizada:", email)
    return user.id
  }

  const created = await DatabaseService.createUser({
    email,
    name,
    password: hashed,
    bio: "Conta de teste para gravar o fluxo TikTok (Login Kit).",
  })
  try {
    await DatabaseService.createUserSettings(created.id)
  } catch {
    // settings podem já existir
  }
  console.log("Criada:", email)
  return created.id as string
}

async function main() {
  const { DatabaseService } = await import("../lib/database")
  await upsertTestUser(DatabaseService, EMAIL, NAME, PASSWORD)
  await upsertTestUser(DatabaseService, "demo@autopostia.com", "Usuário Demo", PASSWORD)
  console.log("Login: https://autopostia.vercel.app/login")
  console.log("E-mail:", EMAIL)
  console.log("Senha:", PASSWORD)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

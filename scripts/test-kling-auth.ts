import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function main() {
  const { getKlingAccountStatus } = await import("../lib/providers/kling-account")
  const { KlingProvider } = await import("../lib/providers/kling-provider")

  const account = await getKlingAccountStatus()
  console.log("Conta API:", account.message)
  if (account.resourcePacks.length > 0) {
    for (const pack of account.resourcePacks) {
      console.log(`- ${pack.resource_pack_name}: ${pack.remaining_quantity}/${pack.total_quantity} (${pack.status})`)
    }
  }

  const provider = new KlingProvider()
  const result = await provider.generateVideo({
    prompt: "subtle head movement, natural blink, speaking to camera",
    durationSeconds: 5,
    aspectRatio: "9:16",
  })

  if (result.status === "failed") {
    const message = result.errorMessage || "Kling auth falhou"
    if (/balance|credit|saldo|1102|pacote de recursos/i.test(message)) {
      console.log("\nAutenticação OK. Falta pacote de recursos da API (não é o saldo do app).")
      return
    }
    throw new Error(message)
  }

  console.log("Kling task:", result.externalJobId)
  console.log("Autenticação Kling OK.")
}

main().catch((err) => {
  console.error("Teste Kling falhou:", err.message)
  process.exit(1)
})

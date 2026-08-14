import { chromium } from "playwright"
import fs from "fs"
import path from "path"

const BASE = process.env.E2E_BASE || "http://localhost:3000"
const EMAIL = process.env.E2E_EMAIL || "demo@autopostia.com"
const PASSWORD = process.env.E2E_PASSWORD || "AutoPostIA#TikTok26"
const outDir = path.join(process.cwd(), "tmp-e2e")

const failures = []
const notes = []

async function main() {
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  page.setDefaultTimeout(90000)
  page.on("pageerror", (err) => failures.push(`pageerror: ${err.message}`))

  async function shot(name) {
    await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true })
  }

  async function mustHave(text, label) {
    const loc = page.getByText(text, { exact: false }).first()
    const vis = await loc.isVisible().catch(() => false)
    if (!vis) {
      await shot(`fail-${label}`)
      failures.push(`não vi "${text}" em ${label} url=${page.url()}`)
    } else notes.push(`ok: ${label} → ${text}`)
  }

  const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
    data: { email: EMAIL, password: PASSWORD },
  })
  if (!loginRes.ok()) {
    failures.push(`API login ${loginRes.status()} ${await loginRes.text()}`)
  } else {
    notes.push("ok: API login")
  }

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 90000 })
  await page.fill("#email", EMAIL)
  await page.fill("#password", PASSWORD)
  await page.locator('form button[type="submit"]').click()
  await page.waitForTimeout(2000)
  if (!page.url().includes("/dashboard")) {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 90000 })
  }
  await shot("01-after-login")

  await mustHave("Estúdio de crescimento", "home")
  await mustHave("Novo short", "home")
  await mustHave("Copiar canal", "home")
  await mustHave("Em alta", "home")

  const obj = page.locator("#growth-objective")
  if (await obj.count()) {
    await obj.selectOption("sales")
    await page.waitForTimeout(400)
    await obj.selectOption("engagement")
    notes.push("ok: trocou objetivo")
  } else {
    failures.push("seletor de objetivo ausente")
  }

  await page.goto(`${BASE}/dashboard/projects/new`, { waitUntil: "domcontentloaded" })
  await mustHave("Novo short", "wizard")
  await page.waitForTimeout(1500)
  await page.locator("#short-idea").fill("3 erros que travam o crescimento no TikTok")
  await page.getByRole("button", { name: "Criar agora" }).click()
  await page.waitForURL(/\/dashboard\/projects\/[0-9a-f-]{8,}/, { timeout: 90000 }).catch(async () => {
    await shot("fail-create")
    failures.push(`criar short não navegou: ${page.url()}`)
  })
  await shot("02-project")
  await page.getByText("Gerar roteiro").first().waitFor({ timeout: 30000 })
  await mustHave("Gerar roteiro", "projeto")
  await mustHave("aguardando aprovação TikTok", "projeto")

  await page.goto(`${BASE}/dashboard/grow/copy-channel`)
  await mustHave("Copiar canal", "copy")
  await page.locator("input").fill("https://www.tiktok.com/@tiktok")
  await page.getByRole("button", { name: "Analisar" }).click()
  await page.getByText("Gerar meu short", { exact: false }).first().waitFor({ timeout: 90000 }).catch(async () => {
    await shot("fail-copy")
    notes.push("aviso: copy-channel sem ideias")
  })
  if (await page.getByText("Gerar meu short").first().isVisible().catch(() => false)) {
    notes.push("ok: copy-channel gerou ideias")
  }

  await page.goto(`${BASE}/dashboard/grow/trending`)
  await mustHave("Em alta", "trending")
  await page.getByText("Usar esta base").first().waitFor({ timeout: 90000 }).catch(async () => {
    await shot("fail-trending")
    notes.push("aviso: trending sem Usar esta base")
  })
  if (await page.getByText("Usar esta base").first().isVisible().catch(() => false)) {
    notes.push("ok: trending")
  }

  await page.goto(`${BASE}/dashboard/avatars`)
  await mustHave("Avatares", "avatars")
  await page.goto(`${BASE}/dashboard/projects`)
  await mustHave("Vídeos", "vídeos")
  await page.goto(`${BASE}/dashboard/social-accounts`)
  await shot("03-social")
  const html = await page.content()
  if (html.includes("TikTok") || html.includes("YouTube")) notes.push("ok: redes")
  else failures.push("redes sem TikTok/YouTube")

  await page.goto(`${BASE}/dashboard/settings`)
  await mustHave("Configurações", "settings")
  await mustHave("Automação", "settings legado")

  await page.goto(`${BASE}/dashboard/automation`)
  await shot("04-automation")
  if (await page.getByText("Application error").isVisible().catch(() => false)) {
    failures.push("automation Application error")
  } else notes.push("ok: automation")

  await browser.close()
  console.log("--- notas ---")
  notes.forEach((n) => console.log(n))
  console.log("--- falhas ---")
  console.log(failures.length ? failures.join("\n") : "nenhuma")
  process.exit(failures.length ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

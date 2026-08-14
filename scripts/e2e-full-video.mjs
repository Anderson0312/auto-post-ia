import { chromium } from "playwright"
import fs from "fs"
import path from "path"

const BASE = "http://localhost:3000"
const EMAIL = "demo@autopostia.com"
const PASSWORD = "AutoPostIA#TikTok26"
const outDir = path.join(process.cwd(), "tmp-e2e-video")

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function getProject(request, id) {
  const res = await request.get(`${BASE}/api/projects/${id}`)
  if (!res.ok()) throw new Error(`GET project ${res.status()}`)
  const json = await res.json()
  return json.project
}

async function waitStatus(request, id, ok, timeoutMs, page) {
  const start = Date.now()
  let last = ""
  while (Date.now() - start < timeoutMs) {
    const project = await getProject(request, id)
    last = `${project.status} err=${project.error_message || ""} video=${project.final_video_url ? "sim" : "não"}`
    console.log("status:", last)
    if (ok(project)) return project
    if (project.status === "failed") return project
    await page?.screenshot({ path: path.join(outDir, `status-${project.status}.png`) }).catch(() => {})
    await sleep(8000)
  }
  throw new Error(`timeout esperando. último: ${last}`)
}

async function main() {
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  page.setDefaultTimeout(120000)

  const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
    data: { email: EMAIL, password: PASSWORD },
    timeout: 60000,
  })
  if (!loginRes.ok()) throw new Error(`login ${loginRes.status()}`)

  await page.goto(`${BASE}/dashboard/projects/new`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1200)
  await page.locator("#short-idea").fill("3 erros que travam o crescimento no TikTok. Tom direto, hook forte, CTA para seguir.")
  await page.getByRole("button", { name: "Criar agora" }).click()
  await page.waitForURL(/\/dashboard\/projects\/[0-9a-f-]{8,}/, { timeout: 90000 })
  const id = page.url().split("/projects/")[1].split("?")[0]
  console.log("projeto", id)
  await page.screenshot({ path: path.join(outDir, "01-created.png") })

  console.log("aguardando roteiro...")
  let project = await waitStatus(
    page.request,
    id,
    (p) => p.project_scripts?.length > 0 || ["storyboard", "generating_scenes", "rendering", "ready"].includes(p.status),
    180000,
    page,
  )
  await page.reload()
  await page.screenshot({ path: path.join(outDir, "02-script.png") })

  if (!project.project_scenes?.length && project.status !== "ready") {
    console.log("clicando Gerar cenas")
    await page.getByRole("button", { name: "Gerar cenas" }).click()
    project = await waitStatus(
      page.request,
      id,
      (p) => (p.project_scenes || []).length > 0 || ["rendering", "ready"].includes(p.status),
      180000,
      page,
    )
  }
  await page.reload()
  await page.screenshot({ path: path.join(outDir, "03-scenes.png") })

  if (project.status !== "ready" && project.status !== "failed") {
    console.log("clicando Gerar vídeo (créditos)")
    await page.getByRole("button", { name: "Gerar vídeo" }).click()
    project = await waitStatus(
      page.request,
      id,
      (p) => p.status === "ready" || p.status === "failed",
      900000,
      page,
    )
  }

  await page.reload()
  await page.screenshot({ path: path.join(outDir, "04-final.png"), fullPage: true })
  console.log("FINAL", {
    status: project.status,
    error: project.error_message,
    video: project.final_video_url,
    thumb: project.thumbnail_url,
    scenes: (project.project_scenes || []).map((s) => ({ order: s.scene_order, status: s.status, video: !!s.video_url })),
  })

  await browser.close()
  if (project.status !== "ready" || !project.final_video_url) process.exit(2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

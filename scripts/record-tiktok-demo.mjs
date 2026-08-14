import { chromium } from "playwright"
import fs from "fs"
import path from "path"
import { spawnSync } from "child_process"

const BASE = "https://autopostia.vercel.app"
const outDir = path.join(process.cwd(), "tmp-tiktok-demo")
const finalMp4 = path.join(process.env.USERPROFILE || ".", "Downloads", "autopostia-tiktok-demo.mp4")

function banner(page, text) {
  return page.evaluate((label) => {
    const id = "tiktok-demo-banner"
    document.getElementById(id)?.remove()
    const el = document.createElement("div")
    el.id = id
    el.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#111;color:#fff;font:600 18px/1.4 Arial,sans-serif;padding:12px 16px;text-align:center;"
    el.textContent = label
    document.body.prepend(el)
    document.body.style.paddingTop = "52px"
  }, text)
}

async function hold(page, ms = 3500) {
  await page.waitForTimeout(ms)
}

async function main() {
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
    locale: "pt-BR",
  })
  const page = await context.newPage()

  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 })
  await banner(page, "AutoPostIA — https://autopostia.vercel.app — vídeo curto com IA para TikTok")
  await hold(page, 4000)

  await page.goto(`${BASE}/terms`, { waitUntil: "domcontentloaded" })
  await banner(page, "Termos de Serviço usados no Login Kit do TikTok")
  await hold(page, 3000)

  await page.goto(`${BASE}/privacy`, { waitUntil: "domcontentloaded" })
  await banner(page, "Política de Privacidade — dados do Login Kit e Content Posting")
  await hold(page, 3000)

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" })
  await banner(
    page,
    "Login Kit: botão TikTok pede user.info.basic, user.info.profile, user.info.stats, video.upload, video.publish",
  )
  await hold(page, 3500)

  const tiktokBtn = page.getByRole("button", { name: "TikTok" })
  if (await tiktokBtn.count()) {
    await Promise.all([
      page.waitForURL(/tiktok|auth/, { timeout: 15000 }).catch(() => null),
      tiktokBtn.click(),
    ])
    await hold(page, 5000)
    await banner(page, "Redirecionamento OAuth Login Kit (sandbox / autorização TikTok)").catch(() => null)
    await hold(page, 4000)
  }

  await page.goto(`${BASE}/dashboard/social-accounts`, { waitUntil: "domcontentloaded" }).catch(() => null)
  await banner(page, "Depois do Login Kit a conta aparece em Redes. Content Posting: video.upload + video.publish").catch(
    () => null,
  )
  await hold(page, 4000)

  await page.goto(`${BASE}/dashboard/projects/new`, { waitUntil: "domcontentloaded" }).catch(() => null)
  await banner(page, "Fluxo do app: criar short 9:16 (roteiro → cenas → vídeo) e publicar no TikTok").catch(() => null)
  await hold(page, 4000)

  await page.goto(BASE, { waitUntil: "domcontentloaded" })
  await banner(page, "Fim da demo — domínio autopostia.vercel.app | Login Kit + Content Posting API")
  await hold(page, 3500)

  await context.close()
  await browser.close()

  const webm = fs.readdirSync(outDir).find((f) => f.endsWith(".webm"))
  if (!webm) throw new Error("Playwright não gerou vídeo")
  const input = path.join(outDir, webm)

  const ffmpegCandidates = [
    path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Links", "ffmpeg.exe"),
    path.join(process.env.LOCALAPPDATA || "", "ms-playwright", "ffmpeg-1011", "ffmpeg-win64.exe"),
    "ffmpeg",
  ]
  const ffmpeg = ffmpegCandidates.find((p) => p === "ffmpeg" || fs.existsSync(p)) || "ffmpeg"

  const result = spawnSync(
    ffmpeg,
    [
      "-y",
      "-i",
      input,
      "-vf",
      "scale=1280:720",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "26",
      "-movflags",
      "+faststart",
      finalMp4,
    ],
    { stdio: "inherit" },
  )
  if (result.status !== 0) {
    fs.copyFileSync(input, finalMp4.replace(/\.mp4$/, ".webm"))
    console.log("MP4 falhou; webm copiado. Input:", input)
  } else {
    console.log("Vídeo pronto:", finalMp4)
    console.log("Tamanho MB:", (fs.statSync(finalMp4).size / 1024 / 1024).toFixed(2))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

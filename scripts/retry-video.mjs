const BASE = "http://localhost:3000"
const EMAIL = process.env.E2E_EMAIL || "tiktok.sandbox@autopostia.com"
const PASSWORD = "AutoPostIA#TikTok26"

async function main() {
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!login.ok) throw new Error(`login ${login.status} ${await login.text()}`)
  const setCookie = login.headers.getSetCookie?.() || []
  const cookie =
    setCookie.map((c) => c.split(";")[0]).join("; ") || (login.headers.get("set-cookie") || "").split(";")[0]
  const headers = { cookie, "Content-Type": "application/json" }

  const list = await fetch(`${BASE}/api/projects`, { headers }).then((r) => r.json())
  const projects = list.projects || []
  if (!projects.length) throw new Error("nenhum projeto")
  console.log(
    "projetos",
    projects.map((p) => `${p.id.slice(0, 8)} ${p.status}`).join(" | "),
  )

  const projectId =
    process.argv[2] ||
    projects.find((p) => ["failed", "storyboard", "generating_scenes", "rendering"].includes(p.status))?.id ||
    projects[0].id
  console.log("usando", projectId)

  const pre = await fetch(`${BASE}/api/projects/${projectId}`, { headers }).then((r) => r.json())
  console.log("antes", {
    status: pre.project?.status,
    error: pre.project?.error_message,
    scenes: pre.project?.project_scenes?.length,
    images: pre.project?.project_scenes?.filter((s) => s.image_url).length,
  })

  console.log("POST generate-video (Kling)...")
  const started = Date.now()
  const res = await fetch(`${BASE}/api/projects/${projectId}/generate-video`, { method: "POST", headers })
  const body = await res.text()
  console.log("POST", res.status, `${Math.round((Date.now() - started) / 1000)}s`, body.slice(0, 800))

  const after = await fetch(`${BASE}/api/projects/${projectId}`, { headers }).then((r) => r.json())
  const p = after.project
  console.log("depois", {
    status: p?.status,
    error: p?.error_message,
    video: p?.final_video_url,
    scenes: p?.project_scenes?.map((s) => ({ o: s.scene_order, st: s.status, vid: Boolean(s.video_url) })),
  })
  if (p?.status !== "ready" || !p?.final_video_url) process.exit(2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

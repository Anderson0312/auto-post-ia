"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PipelineStepper } from "@/components/video/pipeline-stepper"
import { SceneCard } from "@/components/video/scene-card"
import { VideoPreview } from "@/components/video/video-preview"
import { JobProgress } from "@/components/video/job-progress"
import { ProjectPostProduction } from "@/components/video/project-post-production"
import { useProject, useProjectAutoRefresh } from "@/hooks/use-api"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data, loading, refetch } = useProject(id)
  const project = (data as any)?.project
  const { data: jobsData, refetch: refetchJobs } = useProjectAutoRefresh(id, project?.status, refetch)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [more, setMore] = useState(false)

  const jobs = (jobsData as any)?.jobs || []
  const script = project?.project_scripts?.[0]
  const scenes = project?.project_scenes || []
  const config = (project?.config || {}) as Record<string, unknown>

  const runAction = async (action: "script" | "storyboard" | "video") => {
    if (!project) {
      toast.error("Espere o projeto carregar")
      return
    }
    if (action === "video" && !(project.project_scenes || []).length) {
      toast.error("Gere as cenas antes do vídeo")
      return
    }
    setActionLoading(action)
    try {
      if (action === "script") await apiClient.generateProjectScript(id)
      if (action === "storyboard") await apiClient.generateProjectStoryboard(id)
      if (action === "video") await apiClient.generateProjectVideo(id)
      toast.success("Processamento iniciado")
      refetch()
      refetchJobs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no pipeline")
    } finally {
      setActionLoading(null)
    }
  }

  const handleExport = async () => {
    setActionLoading("export")
    try {
      const bundle = await apiClient.exportProject(id)
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `projeto-${id.slice(0, 8)}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao exportar")
    } finally {
      setActionLoading(null)
    }
  }

  if (!loading && !project) return <p className="text-zinc-500">Projeto não encontrado.</p>

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <div>
        <div className="mx-auto aspect-[9/16] max-w-[280px] overflow-hidden rounded-2xl border border-zinc-800 bg-black">
          <VideoPreview url={project?.final_video_url} poster={project?.thumbnail_url} />
        </div>
        <div className="mt-4 space-y-2">
          <button type="button" className="w-full rounded-full bg-fuchsia-500 py-2 text-sm text-white" disabled={!!actionLoading || !project} onClick={() => runAction("script")}>
            Gerar roteiro
          </button>
          <button type="button" className="w-full rounded-full border border-zinc-700 py-2 text-sm" disabled={!!actionLoading || !project} onClick={() => runAction("storyboard")}>
            Gerar cenas
          </button>
          <button type="button" className="w-full rounded-full border border-zinc-700 py-2 text-sm" disabled={!!actionLoading || !project} onClick={() => runAction("video")}>
            Gerar vídeo
          </button>
          <button type="button" disabled className="w-full rounded-full border border-zinc-800 py-2 text-xs text-zinc-500">
            Publicar — aguardando aprovação TikTok
          </button>
          <button
            type="button"
            className="w-full rounded-full border border-red-900 py-2 text-sm text-red-400 hover:bg-red-950/40"
            disabled={!!actionLoading || !project}
            onClick={async () => {
              if (!confirm("Apagar este short e todos os arquivos (roteiro, cenas, vídeo)?")) return
              setActionLoading("delete")
              try {
                await apiClient.deleteProject(id)
                toast.success("Vídeo apagado")
                router.push("/dashboard/projects")
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Erro ao apagar")
              } finally {
                setActionLoading(null)
              }
            }}
          >
            {actionLoading === "delete" ? "Apagando..." : "Apagar vídeo"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{project?.title || "Carregando short..."}</h1>
        {project?.prompt && <p className="text-sm text-zinc-400">{project.prompt}</p>}
        {project?.error_message && (
          <p className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{project.error_message}</p>
        )}
        {project && <PipelineStepper status={project.status} videoEnabled />}
        {project && ["scripting", "storyboard", "generating_scenes", "rendering"].includes(project.status) && (
          <p className="text-sm text-fuchsia-300">
            {project.status === "scripting" && "Escrevendo o roteiro..."}
            {project.status === "storyboard" && "Montando as cenas..."}
            {project.status === "generating_scenes" && "Gerando imagens das cenas..."}
            {project.status === "rendering" && "Renderizando o vídeo 9:16 — isso pode levar alguns minutos."}
          </p>
        )}
        <JobProgress jobs={jobs} />
        {script && (
          <div className="rounded-2xl border border-zinc-800 p-4 text-sm">
            <p><strong>Hook:</strong> {script.hook}</p>
            <p className="mt-2"><strong>CTA:</strong> {script.cta}</p>
          </div>
        )}
        <button type="button" className="text-sm text-zinc-500" onClick={() => setMore(!more)}>
          {more ? "Menos opções" : "Mais opções"}
        </button>
        {more && (
          <ProjectPostProduction
            scriptReady={!!script}
            narration={config.narration as { url?: string; voice?: string } | undefined}
            subtitles={config.subtitles as { srtUrl?: string; vttUrl?: string; cueCount?: number } | undefined}
            actionLoading={actionLoading}
            onNarration={async () => {
              setActionLoading("narration")
              try {
                await apiClient.generateProjectNarration(id)
                refetch()
              } finally {
                setActionLoading(null)
              }
            }}
            onSubtitles={async () => {
              setActionLoading("subtitles")
              try {
                await apiClient.generateProjectSubtitles(id)
                refetch()
              } finally {
                setActionLoading(null)
              }
            }}
            onExport={handleExport}
          />
        )}
        {scenes.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {scenes.map((scene: any) => (
              <SceneCard key={scene.id} scene={scene} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

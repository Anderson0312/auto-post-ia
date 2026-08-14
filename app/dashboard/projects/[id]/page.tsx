"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserMenu } from "@/components/user-menu"
import { DashboardNav } from "@/components/dashboard-nav"
import { PipelineStepper } from "@/components/video/pipeline-stepper"
import { SceneCard } from "@/components/video/scene-card"
import { VideoPreview } from "@/components/video/video-preview"
import { JobProgress } from "@/components/video/job-progress"
import { ProjectPostProduction } from "@/components/video/project-post-production"
import { VideoProvidersStatus } from "@/components/video/video-providers-status"
import { useProject, useProjectAutoRefresh } from "@/hooks/use-api"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data, loading, refetch } = useProject(id)
  const project = (data as any)?.project
  const { data: jobsData, refetch: refetchJobs } = useProjectAutoRefresh(id, project?.status, refetch)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [hookOptimization, setHookOptimization] = useState<any>(null)

  const jobs = (jobsData as any)?.jobs || []
  const script = project?.project_scripts?.[0]
  const scenes = project?.project_scenes || []
  const config = (project?.config || {}) as Record<string, unknown>

  const runAction = async (action: "script" | "storyboard" | "video") => {
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
      toast.success("Pacote exportado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao exportar")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project?.title || "Short"}</h1>
            <p className="text-sm text-muted-foreground">{project?.prompt}</p>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <DashboardNav />
        <VideoProvidersStatus />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link href="/dashboard/projects">Voltar</Link></Button>
          <Button variant="ghost" onClick={() => { refetch(); refetchJobs() }}>Atualizar</Button>
          <Button onClick={() => runAction("script")} disabled={!!actionLoading}>
            {actionLoading === "script" ? "Gerando..." : "1. Roteiro"}
          </Button>
          <Button onClick={() => runAction("storyboard")} disabled={!!actionLoading}>
            {actionLoading === "storyboard" ? "Gerando..." : "2. Storyboard"}
          </Button>
          <Button onClick={() => runAction("video")} disabled={!!actionLoading}>
            {actionLoading === "video" ? "Gerando..." : "3. Gerar vídeo 9:16"}
          </Button>
          {script?.hook && (
            <Button
              variant="outline"
              disabled={!!actionLoading}
              onClick={async () => {
                setActionLoading("hook")
                try {
                  const result = await apiClient.optimizeHook({
                    hook: script.hook,
                    fullScript: script.full_script,
                    platform: project?.target_platform,
                    objective: project?.objective,
                  })
                  setHookOptimization(result)
                  toast.success("Hook otimizado")
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Erro ao otimizar hook")
                } finally {
                  setActionLoading(null)
                }
              }}
            >
              {actionLoading === "hook" ? "Otimizando..." : "Otimizar hook"}
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando projeto...</p>
        ) : project ? (
          <>
            {project.error_message && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {project.error_message}
              </p>
            )}
            <PipelineStepper status={project.status} videoEnabled />
            <JobProgress jobs={jobs} />

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Preview do short</CardTitle></CardHeader>
                <CardContent>
                  <VideoPreview url={project.final_video_url} poster={project.thumbnail_url} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Roteiro</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {script ? (
                    <>
                      <div><strong>Hook:</strong> {script.hook}</div>
                      <div><strong>Corpo:</strong> {script.body}</div>
                      <div><strong>CTA:</strong> {script.cta}</div>
                      <pre className="whitespace-pre-wrap bg-muted p-3 rounded-lg text-xs">{script.full_script}</pre>
                      {hookOptimization && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2 text-xs">
                          <p><strong>Hook otimizado:</strong> {hookOptimization.improvedHook}</p>
                          {hookOptimization.captionSuggestions?.length > 0 && (
                            <p><strong>Legendas:</strong> {hookOptimization.captionSuggestions.join(" · ")}</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Roteiro ainda não gerado.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <ProjectPostProduction
              scriptReady={!!script}
              narration={config.narration as { url?: string; voice?: string } | undefined}
              subtitles={config.subtitles as { srtUrl?: string; vttUrl?: string; cueCount?: number } | undefined}
              actionLoading={actionLoading}
              onNarration={async () => {
                setActionLoading("narration")
                try {
                  await apiClient.generateProjectNarration(id)
                  toast.success("Narração gerada")
                  refetch()
                  refetchJobs()
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Erro na narração")
                } finally {
                  setActionLoading(null)
                }
              }}
              onSubtitles={async () => {
                setActionLoading("subtitles")
                try {
                  await apiClient.generateProjectSubtitles(id)
                  toast.success("Legendas geradas")
                  refetch()
                  refetchJobs()
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Erro nas legendas")
                } finally {
                  setActionLoading(null)
                }
              }}
              onExport={handleExport}
            />

            {scenes.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Cenas ({scenes.length})</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {scenes.map((scene: any) => (
                    <SceneCard key={scene.id} scene={scene} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">Projeto não encontrado.</p>
        )}
      </main>
    </div>
  )
}

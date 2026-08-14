"use client"

import Link from "next/link"
import { useProjects } from "@/hooks/use-api"

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  scripting: "Roteiro",
  storyboard: "Storyboard",
  generating_scenes: "Cenas",
  rendering: "Vídeo",
  ready: "Pronto",
  failed: "Falhou",
}

export default function ProjectsPage() {
  const { data, loading } = useProjects()
  const projects = (data as any)?.projects || []

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vídeos</h1>
          <p className="text-sm text-zinc-400">Grade 9:16 — seus shorts</p>
        </div>
        <Link href="/dashboard/projects/new" className="rounded-full bg-fuchsia-500 px-4 py-2 text-sm text-white">
          Novo short
        </Link>
      </div>

      {loading ? (
        <p className="text-zinc-500">Carregando...</p>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-zinc-400">Nenhum short ainda.</p>
          <div className="mt-4 flex justify-center gap-3 text-sm">
            <Link href="/dashboard/projects/new" className="text-fuchsia-400">Criar</Link>
            <Link href="/dashboard/grow/copy-channel" className="text-fuchsia-400">Copiar canal</Link>
            <Link href="/dashboard/grow/trending" className="text-fuchsia-400">Em alta</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {projects.map((project: any) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <div className="aspect-[9/16] overflow-hidden rounded-xl bg-zinc-900">
                {(project.thumbnail_url || project.final_video_url) && (
                  <img src={project.thumbnail_url || project.final_video_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-xs">{project.title}</p>
              <p className="text-[10px] text-zinc-500">{statusLabels[project.status] || project.status}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

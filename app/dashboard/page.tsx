"use client"

import Link from "next/link"
import { useProjects } from "@/hooks/use-api"
import { Copy, Flame, Plus } from "lucide-react"

export default function DashboardPage() {
  const { data, loading } = useProjects()
  const projects = (data as any)?.projects || []
  const queued = projects.filter((p: any) => !["ready", "failed"].includes(p.status)).length
  const ready = projects.filter((p: any) => p.status === "ready").length

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-fuchsia-400">Estúdio de crescimento</p>
        <h1 className="text-3xl font-semibold">Sua conta de shorts</h1>
        <p className="mt-1 text-zinc-400">Objetivo padrão: engajamento. Troque no topo quando for vender ou educar.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Na fila</p>
          <p className="text-2xl font-semibold">{loading ? "—" : queued}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Prontos</p>
          <p className="text-2xl font-semibold">{loading ? "—" : ready}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Total</p>
          <p className="text-2xl font-semibold">{loading ? "—" : projects.length}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/projects/new" className="rounded-2xl border border-zinc-800 p-6 hover:border-fuchsia-500/50">
          <Plus className="mb-3 h-6 w-6 text-fuchsia-400" />
          <h2 className="font-medium">Novo short</h2>
          <p className="mt-1 text-sm text-zinc-500">Uma ideia. A IA gera ângulos virais.</p>
        </Link>
        <Link href="/dashboard/grow/copy-channel" className="rounded-2xl border border-zinc-800 p-6 hover:border-fuchsia-500/50">
          <Copy className="mb-3 h-6 w-6 text-fuchsia-400" />
          <h2 className="font-medium">Copiar canal</h2>
          <p className="mt-1 text-sm text-zinc-500">Cole um TikTok ou YouTube. Copiamos formato, não o vídeo.</p>
        </Link>
        <Link href="/dashboard/grow/trending" className="rounded-2xl border border-zinc-800 p-6 hover:border-fuchsia-500/50">
          <Flame className="mb-3 h-6 w-6 text-fuchsia-400" />
          <h2 className="font-medium">Em alta</h2>
          <p className="mt-1 text-sm text-zinc-500">Tendências e formatos para usar como base.</p>
        </Link>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Últimos shorts</h2>
          <Link href="/dashboard/projects" className="text-sm text-fuchsia-400">
            Ver todos
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center text-zinc-500">
            Nenhum short ainda. Comece por uma ideia, um canal ou um trend.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {projects.slice(0, 10).map((p: any) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="group">
                <div className="aspect-[9/16] overflow-hidden rounded-xl bg-zinc-900">
                  {p.thumbnail_url || p.final_video_url ? (
                    <img src={p.thumbnail_url || p.final_video_url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-zinc-300 group-hover:text-white">{p.title}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

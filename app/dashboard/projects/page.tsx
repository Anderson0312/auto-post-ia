"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Clapperboard } from "lucide-react"
import { UserMenu } from "@/components/user-menu"
import { DashboardNav } from "@/components/dashboard-nav"
import { useProjects } from "@/hooks/use-api"

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  scripting: "Roteiro",
  storyboard: "Storyboard",
  generating_scenes: "Gerando cenas",
  rendering: "Renderizando",
  ready: "Pronto",
  failed: "Falhou",
}

export default function ProjectsPage() {
  const { data, loading, refetch } = useProjects()
  const projects = (data as any)?.projects || []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Projetos de Vídeo</h1>
            <p className="text-sm text-muted-foreground">Biblioteca de conteúdos virais</p>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <DashboardNav />

        <div className="flex gap-3">
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => refetch()}>Atualizar</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando projetos...</p>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clapperboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum projeto criado ainda.</p>
              <Button asChild><Link href="/dashboard/projects/new">Criar primeiro projeto</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: any) => (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg line-clamp-1">{project.title}</CardTitle>
                      <Badge variant="outline">{statusLabels[project.status] || project.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(project.thumbnail_url || project.final_video_url) ? (
                      <img
                        src={project.thumbnail_url || project.final_video_url}
                        alt={project.title}
                        className="w-full aspect-[9/16] object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full aspect-[9/16] bg-muted rounded-lg mb-3" />
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.prompt}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

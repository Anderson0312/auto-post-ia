"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserMenu } from "@/components/user-menu"
import { DashboardNav } from "@/components/dashboard-nav"
import { AvatarGallery } from "@/components/video/avatar-gallery"
import { useAvatar } from "@/hooks/use-api"

export default function AvatarDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data, loading, refetch } = useAvatar(id)
  const avatar = (data as any)?.avatar

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{avatar?.name || "Avatar"}</h1>
            <Badge variant="outline" className="mt-1">{avatar?.status}</Badge>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <DashboardNav />
        <Button variant="outline" asChild><Link href="/dashboard/avatars">Voltar</Link></Button>
        <Button variant="ghost" onClick={() => refetch()}>Atualizar</Button>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : avatar ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Imagem principal</CardTitle></CardHeader>
              <CardContent>
                {avatar.main_image_url ? (
                  <img src={avatar.main_image_url} alt={avatar.name} className="rounded-lg w-full aspect-[9/16] object-cover" />
                ) : (
                  <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                    Processando identidade visual...
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Descrição:</strong> {avatar.description}</p>
                  <p><strong>Nicho:</strong> {avatar.niche || "—"}</p>
                  <p><strong>Estilo:</strong> {avatar.visual_style || "—"}</p>
                  <p><strong>Personalidade:</strong> {avatar.personality || "—"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Master Prompt</CardTitle></CardHeader>
                <CardContent>
                  <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded-lg">{avatar.master_prompt || "Gerando..."}</pre>
                </CardContent>
              </Card>
            </div>

            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Galeria</CardTitle></CardHeader>
              <CardContent>
                <AvatarGallery assets={avatar.avatar_assets || []} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-muted-foreground">Avatar não encontrado.</p>
        )}
      </main>
    </div>
  )
}

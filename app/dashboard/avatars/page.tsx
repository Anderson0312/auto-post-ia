"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, UserCircle2 } from "lucide-react"
import { UserMenu } from "@/components/user-menu"
import { DashboardNav } from "@/components/dashboard-nav"
import { useAvatars } from "@/hooks/use-api"

export default function AvatarsPage() {
  const { data, loading, refetch } = useAvatars()
  const avatars = (data as any)?.avatars || []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Avatares</h1>
            <p className="text-sm text-muted-foreground">Biblioteca de modelos virtuais</p>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <DashboardNav />

        <div className="flex gap-3">
          <Button asChild>
            <Link href="/dashboard/avatars/new">
              <Plus className="h-4 w-4 mr-2" />
              Criar Avatar
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/avatars/new?mode=import">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => refetch()}>Atualizar</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando avatares...</p>
        ) : avatars.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum avatar criado ainda.</p>
              <Button asChild>
                <Link href="/dashboard/avatars/new">Criar primeiro avatar</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {avatars.map((avatar: any) => (
              <Link key={avatar.id} href={`/dashboard/avatars/${avatar.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{avatar.name}</CardTitle>
                      <Badge variant="outline">{avatar.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {avatar.main_image_url ? (
                      <img
                        src={avatar.main_image_url}
                        alt={avatar.name}
                        className="w-full aspect-[9/16] object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full aspect-[9/16] bg-muted rounded-lg mb-3 flex items-center justify-center text-sm text-muted-foreground">
                        Gerando...
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">{avatar.description}</p>
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

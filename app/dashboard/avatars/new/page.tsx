"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserMenu } from "@/components/user-menu"
import { DashboardNav } from "@/components/dashboard-nav"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

export default function NewAvatarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Carregando...</div>}>
      <NewAvatarPageContent />
    </Suspense>
  )
}

function NewAvatarPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isImport = searchParams.get("mode") === "import"

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    visualStyle: "",
    niche: "",
    personality: "",
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { avatar } = await apiClient.createAvatar(form)
      toast.success("Avatar em processamento")
      router.push(`/dashboard/avatars/${avatar.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar avatar")
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formEl = e.currentTarget
      const fileInput = formEl.elements.namedItem("images") as HTMLInputElement
      const files = fileInput?.files
      if (!files?.length) {
        toast.error("Selecione pelo menos uma imagem")
        return
      }

      const images = await Promise.all(
        Array.from(files).map(
          (file) =>
            new Promise<{ base64: string; mimeType: string; filename: string }>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result as string
                resolve({
                  base64: result.split(",")[1],
                  mimeType: file.type,
                  filename: file.name,
                })
              }
              reader.onerror = reject
              reader.readAsDataURL(file)
            }),
        ),
      )

      const { avatar } = await apiClient.importAvatar({
        name: form.name,
        description: form.description,
        images,
      })

      toast.success("Avatar importado")
      router.push(`/dashboard/avatars/${avatar.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao importar avatar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{isImport ? "Importar Avatar" : "Criar Avatar"}</h1>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <DashboardNav />

        <Card>
          <CardHeader>
            <CardTitle>{isImport ? "Enviar fotos de referência" : "Descreva seu personagem"}</CardTitle>
          </CardHeader>
          <CardContent>
            {isImport ? (
              <form onSubmit={handleImport} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="images">Fotos</Label>
                  <Input id="images" name="images" type="file" accept="image/*" multiple required />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}>{loading ? "Importando..." : "Importar"}</Button>
                  <Button variant="outline" asChild><Link href="/dashboard/avatars">Cancelar</Link></Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="visualStyle">Estilo visual</Label>
                  <Input id="visualStyle" value={form.visualStyle} onChange={(e) => setForm({ ...form, visualStyle: e.target.value })} placeholder="Ex: realista, influencer moderno" />
                </div>
                <div>
                  <Label htmlFor="niche">Nicho</Label>
                  <Input id="niche" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="personality">Personalidade</Label>
                  <Input id="personality" value={form.personality} onChange={(e) => setForm({ ...form, personality: e.target.value })} />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={loading}>{loading ? "Criando..." : "Criar Avatar"}</Button>
                  <Button variant="outline" asChild><Link href="/dashboard/avatars">Cancelar</Link></Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

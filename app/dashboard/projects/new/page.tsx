"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserMenu } from "@/components/user-menu"
import { DashboardNav } from "@/components/dashboard-nav"
import { useAvatars } from "@/hooks/use-api"
import { apiClient } from "@/lib/api-client"
import { GuidedBriefForm } from "@/components/video/guided-brief-form"
import { ViralIdeasPanel } from "@/components/video/viral-ideas-panel"
import { TrendsPanel } from "@/components/video/trends-panel"
import { toast } from "sonner"

export default function NewProjectPage() {
  const router = useRouter()
  const { data: avatarsData } = useAvatars()
  const avatars = (avatarsData as any)?.avatars || []

  const [loading, setLoading] = useState(false)
  const [viralConfig, setViralConfig] = useState<Record<string, unknown>>({})
  const [form, setForm] = useState({
    title: "",
    prompt: "",
    avatar_id: "none",
    objective: "engagement",
    target_platform: "instagram",
    duration_seconds: 30,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        avatar_id: form.avatar_id === "none" ? undefined : form.avatar_id,
        config: Object.keys(viralConfig).length > 0 ? viralConfig : undefined,
      }
      const { project } = await apiClient.createProject(payload)
      toast.success("Projeto criado")
      router.push(`/dashboard/projects/${project.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar projeto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Novo Projeto de Vídeo</h1>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <DashboardNav />

        <div className="grid md:grid-cols-2 gap-4">
          <GuidedBriefForm
            platform={form.target_platform}
            objective={form.objective}
            onApply={({ title, prompt }) => {
              setForm((prev) => ({ ...prev, title: title || prev.title, prompt }))
              toast.success("Briefing aplicado ao formulário")
            }}
          />
          <ViralIdeasPanel
            niche={form.prompt || form.title}
            platform={form.target_platform}
            objective={form.objective}
            onSelect={(idea) => {
              setForm((prev) => ({
                ...prev,
                title: idea.title,
                prompt: `${idea.hook}\n\nÂngulo: ${idea.angle}\nFormato: ${idea.format}\nCTA: ${idea.cta}`,
              }))
              setViralConfig((prev) => ({ ...prev, viralIdea: idea }))
              toast.success("Ideia aplicada")
            }}
          />
          <TrendsPanel
            niche={form.prompt || form.title}
            platform={form.target_platform}
            objective={form.objective}
            onSelect={(trend) => {
              setForm((prev) => ({
                ...prev,
                title: trend.title,
                prompt: `${trend.hook}\n\nFormato: ${trend.format}\nHashtags: ${trend.hashtags?.join(" ") || ""}`,
              }))
              setViralConfig((prev) => ({
                ...prev,
                trendsContext: `${trend.title} — ${trend.format}: ${trend.hook}`,
                trends: [...((prev.trends as unknown[]) || []), trend].slice(-5),
              }))
              toast.success("Tendência aplicada")
            }}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="prompt">Prompt / ideia do vídeo</Label>
                <Textarea
                  id="prompt"
                  required
                  rows={4}
                  value={form.prompt}
                  onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                  placeholder="Ex: Crie um vídeo viral sobre produtividade para empreendedores"
                />
              </div>
              <div>
                <Label>Avatar (opcional)</Label>
                <Select value={form.avatar_id} onValueChange={(v) => setForm({ ...form, avatar_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um avatar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {avatars.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Objetivo</Label>
                  <Select value={form.objective} onValueChange={(v) => setForm({ ...form, objective: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="views">Visualizações</SelectItem>
                      <SelectItem value="followers">Seguidores</SelectItem>
                      <SelectItem value="engagement">Engajamento</SelectItem>
                      <SelectItem value="sales">Vendas</SelectItem>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="branding">Branding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plataforma</Label>
                  <Select value={form.target_platform} onValueChange={(v) => setForm({ ...form, target_platform: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram Reels</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube Shorts</SelectItem>
                      <SelectItem value="facebook">Facebook Reels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="duration">Duração (segundos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  max={90}
                  value={form.duration_seconds}
                  onChange={(e) => setForm({ ...form, duration_seconds: Number(e.target.value) })}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>{loading ? "Criando..." : "Criar Projeto"}</Button>
                <Button variant="outline" asChild><Link href="/dashboard/projects">Cancelar</Link></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

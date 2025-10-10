"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bot,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Eye,
  MessageCircle,
  Share,
  Zap,
  Play,
} from "lucide-react"
import Link from "next/link"
import { UserMenu } from "@/components/user-menu"
import { useSocialAccounts, useAIConfig, usePosts } from "@/hooks/use-api"

function formatDate(dt?: string | null) {
  if (!dt) return "—"
  const d = new Date(dt)
  return d.toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" })
}

export function getPlatformMeta(platform: string) {
  const key = String(platform || "").toLowerCase()
  switch (key) {
    case "instagram":
      return { icon: Instagram, color: "text-pink-600", bgColor: "bg-pink-50", label: "Instagram" }
    case "linkedin":
      return { icon: Linkedin, color: "text-blue-600", bgColor: "bg-blue-50", label: "LinkedIn" }
    case "facebook":
      return { icon: Facebook, color: "text-blue-700", bgColor: "bg-blue-50", label: "Facebook" }
    case "twitter":
      return { icon: Twitter, color: "text-black", bgColor: "bg-gray-50", label: "Twitter" }
    default:
      return { icon: Users, color: "text-gray-700", bgColor: "bg-gray-50", label: platform }
  }
}

export default function DashboardPage() {
  const { data: accountsResp, loading: loadingAccounts } = useSocialAccounts()
  const { data: aiResp, loading: loadingAI } = useAIConfig()
  const { data: postsResp, loading: loadingPosts } = usePosts()

  const accounts = useMemo(() => {
    const list: any[] = Array.isArray((accountsResp as any)?.accounts) ? (accountsResp as any).accounts : []
    return list
  }, [accountsResp])

  const posts = useMemo(() => {
    return Array.isArray(postsResp as any) ? (postsResp as any) : []
  }, [postsResp])

  const aiConfig = useMemo(() => {
    return (aiResp as any)?.config || null
  }, [aiResp])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Publicado
          </Badge>
        )
      case "scheduled":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Agendado
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Falhou
          </Badge>
        )
      default:
        return <Badge variant="secondary">Desconhecido</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AutoPostIA</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/automation">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
                <Zap className="w-4 h-4 mr-2" />
                Automação
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo ao seu Dashboard</h1>
          <p className="text-gray-600">
            Gerencie suas redes sociais e acompanhe o desempenho dos seus posts automatizados
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Posts este mês</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingPosts ? "…" : posts.filter((p: any) => {
                      const d = p.created_at ? new Date(p.created_at) : null
                      const now = new Date()
                      return (
                        d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                      )
                    }).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-4">
                <Progress value={loadingPosts ? 0 : Math.min(100, posts.length * 4)} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">{loadingPosts ? "Carregando…" : "Progresso mensal"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Redes conectadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingAccounts ? "…" : `${accounts.length}/4`}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4">
                <Progress value={loadingAccounts ? 0 : Math.min(100, (accounts.length / 4) * 100)} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">{loadingAccounts ? "Carregando…" : "Conecte mais redes"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Engajamento (visualizações)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingPosts
                      ? "…"
                      : posts.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0).toLocaleString("pt-BR")}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">Baseado nos posts recentes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de sucesso</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingPosts
                      ? "…"
                      : (() => {
                          const total = posts.length || 1
                          const ok = posts.filter((p: any) => p.status === "published").length
                          return `${Math.round((ok / total) * 100)}%`
                        })()}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">
                  {loadingPosts
                    ? "Carregando…"
                    : `${posts.filter((p: any) => p.status === "published").length}/${posts.length} posts publicados`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Status da Automação */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Automação</p>
                  <p className="text-lg font-bold text-blue-700">
                    {loadingAI ? "…" : aiConfig ? "Ativa" : "Configurar"}
                  </p>
                </div>
                <div className="relative">
                  <Zap className="w-8 h-8 text-blue-600" />
                  {aiConfig && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <Link href="/dashboard/automation">
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Play className="w-3 h-3 mr-1" />
                    {aiConfig ? "Gerenciar" : "Ativar"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="posts">Posts Recentes</TabsTrigger>
            <TabsTrigger value="accounts">Contas Conectadas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Configure sua automação em poucos cliques</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Botão principal de automação */}
                  <Link href="/dashboard/automation">
                    <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
                      <Zap className="w-4 h-4 mr-2" />
                      Automação de Posts
                      <Play className="w-3 h-3 ml-auto" />
                    </Button>
                  </Link>
                  
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Configurações</p>
                    <Link href="/dashboard/ai-config">
                      <Button className="w-full justify-start" variant="outline">
                        <Bot className="w-4 h-4 mr-2" />
                        Configurar IA e Temas
                      </Button>
                    </Link>
                    <Link href="/dashboard/social-accounts">
                      <Button className="w-full justify-start" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Conectar Nova Rede Social
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Análise</p>
                    <Link href="/dashboard/schedule">
                      <Button className="w-full justify-start" variant="outline">
                        <Calendar className="w-4 h-4 mr-2" />
                        Ver Calendário de Posts
                      </Button>
                    </Link>
                    <Link href="/dashboard/reports">
                      <Button className="w-full justify-start" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Relatórios Detalhados
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* AI Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status da IA</CardTitle>
                  <CardDescription>Configuração atual da automação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Temas configurados</span>
                    <Badge variant="secondary">
                      {loadingAI ? "…" : `${(aiConfig?.themes || []).length} temas`}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Posts por dia</span>
                    <Badge variant="secondary">{loadingAI ? "…" : `${aiConfig?.posts_per_day || 0} posts`}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Horários definidos</span>
                    <Badge className="bg-green-100 text-green-800">
                      {loadingAI ? "…" : (aiConfig?.post_times || []).join(", ")}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Próximo post</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {loadingPosts
                        ? "…"
                        : (() => {
                            const next = [...posts]
                              .filter((p: any) => p.status === "scheduled" && p.scheduled_for)
                              .sort((a: any, b: any) =>
                                new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime(),
                              )[0]
                            return next ? formatDate(next.scheduled_for) : "Nenhum post agendado"
                          })()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Posts Recentes</CardTitle>
                <CardDescription>Acompanhe o status dos seus posts automatizados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingPosts && <p className="text-sm text-gray-500">Carregando posts…</p>}
                  {!loadingPosts && posts.length === 0 && (
                    <p className="text-sm text-gray-500">Nenhum post encontrado</p>
                  )}
                  {!loadingPosts && posts.map((post: any) => (
                    <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {getPlatformMeta(post?.social_accounts?.platform || "").label}
                          </Badge>
                          {getStatusBadge(post.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{post.content}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(post.published_at || post.scheduled_for || post.created_at)}
                        </p>
                      </div>
                      {post.status === "published" && (
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.views_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <Share className="w-4 h-4" />
                            {post.shares_count || 0}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contas Conectadas</CardTitle>
                <CardDescription>Gerencie suas conexões com redes sociais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {loadingAccounts && <p className="text-sm text-gray-500">Carregando contas…</p>}
                  {!loadingAccounts && accounts.length === 0 && (
                    <p className="text-sm text-gray-500">Nenhuma conta conectada</p>
                  )}
                  {!loadingAccounts &&
                    accounts.map((acc: any) => {
                      const meta = getPlatformMeta(acc.platform)
                      const Icon = meta.icon
                      return (
                        <div key={acc.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Icon className={`w-6 h-6 ${meta.color}`} />
                            <div>
                              <p className="font-medium">{meta.label}</p>
                              <p className="text-sm text-gray-500">{acc.username || acc.display_name || "—"}</p>
                            </div>
                          </div>
                          {acc.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                          )}
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

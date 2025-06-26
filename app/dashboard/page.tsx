"use client"

import { useState } from "react"
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
  Heart,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { UserMenu } from "@/components/user-menu"

export default function DashboardPage() {
  const [connectedAccounts] = useState([
    { platform: "Instagram", connected: true, icon: Instagram, color: "text-pink-600" },
    { platform: "LinkedIn", connected: true, icon: Linkedin, color: "text-blue-600" },
    { platform: "Facebook", connected: false, icon: Facebook, color: "text-blue-700" },
    { platform: "Twitter", connected: false, icon: Twitter, color: "text-black" },
  ])

  const [recentPosts] = useState([
    {
      id: 1,
      platform: "Instagram",
      content: "Dicas de produtividade para empreendedores...",
      status: "published",
      date: "2024-01-15",
      engagement: { likes: 45, comments: 12, views: 234 },
    },
    {
      id: 2,
      platform: "LinkedIn",
      content: "Como a IA está transformando o marketing digital...",
      status: "scheduled",
      date: "2024-01-16",
      engagement: { likes: 0, comments: 0, views: 0 },
    },
    {
      id: 3,
      platform: "Instagram",
      content: "Tendências de design para 2024...",
      status: "failed",
      date: "2024-01-14",
      engagement: { likes: 0, comments: 0, views: 0 },
    },
  ])

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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Posts este mês</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-4">
                <Progress value={80} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">80% da meta mensal</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Redes conectadas</p>
                  <p className="text-2xl font-bold text-gray-900">2/4</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4">
                <Progress value={50} className="h-2" />
                <p className="text-xs text-gray-500 mt-2">Conecte mais redes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Engajamento</p>
                  <p className="text-2xl font-bold text-gray-900">1.2K</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-green-600">+15% vs mês anterior</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de sucesso</p>
                  <p className="text-2xl font-bold text-gray-900">94%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">23/24 posts publicados</p>
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
                    <Badge variant="secondary">3 temas</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Posts por dia</span>
                    <Badge variant="secondary">2 posts</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Horários definidos</span>
                    <Badge className="bg-green-100 text-green-800">9h, 15h</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Próximo post</span>
                    <Badge className="bg-blue-100 text-blue-800">Hoje às 15h</Badge>
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
                  {recentPosts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{post.platform}</Badge>
                          {getStatusBadge(post.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{post.content}</p>
                        <p className="text-xs text-gray-500">{post.date}</p>
                      </div>
                      {post.status === "published" && (
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.engagement.views}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {post.engagement.likes}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.engagement.comments}
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
                  {connectedAccounts.map((account) => (
                    <div key={account.platform} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <account.icon className={`w-6 h-6 ${account.color}`} />
                        <div>
                          <p className="font-medium">{account.platform}</p>
                          <p className="text-sm text-gray-500">{account.connected ? "Conectado" : "Não conectado"}</p>
                        </div>
                      </div>
                      {account.connected ? (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Button size="sm">Conectar</Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

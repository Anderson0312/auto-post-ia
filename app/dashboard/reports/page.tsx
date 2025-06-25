"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Share,
  Instagram,
  Linkedin,
  Calendar,
} from "lucide-react"
import Link from "next/link"

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30days")

  const [stats] = useState({
    totalPosts: 24,
    totalEngagement: 1247,
    totalReach: 8934,
    avgEngagementRate: 4.2,
    topPerformingPost: "Dicas de produtividade para empreendedores",
    growthRate: 15.3,
  })

  const [platformStats] = useState([
    {
      platform: "Instagram",
      icon: Instagram,
      color: "text-pink-600",
      posts: 12,
      engagement: 856,
      reach: 5234,
      engagementRate: 5.1,
      growth: 18.2,
    },
    {
      platform: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-600",
      posts: 12,
      engagement: 391,
      reach: 3700,
      engagementRate: 3.3,
      growth: 12.4,
    },
  ])

  const [recentPosts] = useState([
    {
      id: 1,
      platform: "Instagram",
      icon: Instagram,
      color: "text-pink-600",
      content: "Dicas de produtividade para empreendedores...",
      date: "2024-01-15",
      metrics: { likes: 45, comments: 12, shares: 8, views: 234 },
      engagementRate: 6.2,
    },
    {
      id: 2,
      platform: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-600",
      content: "Como a IA está transformando o marketing digital...",
      date: "2024-01-14",
      metrics: { likes: 28, comments: 15, shares: 12, views: 189 },
      engagementRate: 4.8,
    },
    {
      id: 3,
      platform: "Instagram",
      icon: Instagram,
      color: "text-pink-600",
      content: "Tendências de design para 2024...",
      date: "2024-01-13",
      metrics: { likes: 67, comments: 23, shares: 15, views: 312 },
      engagementRate: 7.1,
    },
  ])

  const exportReport = () => {
    alert("Relatório será exportado em PDF")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Relatórios e Análises</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
                <SelectItem value="1year">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Overview Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Posts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600">+{stats.growthRate}%</span>
                  <span className="text-gray-500 ml-1">vs período anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Engajamento Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalEngagement.toLocaleString()}</p>
                  </div>
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600">+12.3%</span>
                  <span className="text-gray-500 ml-1">vs período anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Alcance Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalReach.toLocaleString()}</p>
                  </div>
                  <Eye className="w-8 h-8 text-purple-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-green-600">+8.7%</span>
                  <span className="text-gray-500 ml-1">vs período anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Engajamento</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgEngagementRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  <span className="text-red-600">-2.1%</span>
                  <span className="text-gray-500 ml-1">vs período anterior</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="platforms" className="space-y-6">
            <TabsList>
              <TabsTrigger value="platforms">Por Plataforma</TabsTrigger>
              <TabsTrigger value="posts">Posts Individuais</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="platforms" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {platformStats.map((platform) => (
                  <Card key={platform.platform}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <platform.icon className={`w-5 h-5 ${platform.color}`} />
                        {platform.platform}
                      </CardTitle>
                      <CardDescription>
                        Desempenho nos últimos{" "}
                        {selectedPeriod === "7days" ? "7 dias" : selectedPeriod === "30days" ? "30 dias" : "90 dias"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Posts</p>
                          <p className="text-2xl font-bold">{platform.posts}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Engajamento</p>
                          <p className="text-2xl font-bold">{platform.engagement}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Alcance</p>
                          <p className="text-2xl font-bold">{platform.reach.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Taxa de Eng.</p>
                          <p className="text-2xl font-bold">{platform.engagementRate}%</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm text-gray-600">Crescimento</span>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-green-600 font-medium">+{platform.growth}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="posts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho dos Posts</CardTitle>
                  <CardDescription>Análise detalhada de cada post publicado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <post.icon className={`w-5 h-5 ${post.color}`} />
                            <span className="font-medium">{post.platform}</span>
                            <Badge variant="outline">{post.date}</Badge>
                            <Badge
                              className={
                                post.engagementRate > 5
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {post.engagementRate}% eng.
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{post.content}</p>
                        <div className="grid grid-cols-4 gap-4 pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span>{post.metrics.views}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Heart className="w-4 h-4 text-red-400" />
                            <span>{post.metrics.likes}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MessageCircle className="w-4 h-4 text-blue-400" />
                            <span>{post.metrics.comments}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Share className="w-4 h-4 text-green-400" />
                            <span>{post.metrics.shares}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Melhores Horários</CardTitle>
                    <CardDescription>Quando seu público está mais ativo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">09:00 - 10:00</span>
                        <Badge className="bg-green-100 text-green-800">Alto engajamento</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">15:00 - 16:00</span>
                        <Badge className="bg-green-100 text-green-800">Alto engajamento</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">19:00 - 20:00</span>
                        <Badge className="bg-yellow-100 text-yellow-800">Médio engajamento</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Temas de Maior Sucesso</CardTitle>
                    <CardDescription>Conteúdos que geram mais engajamento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Produtividade</span>
                        <Badge className="bg-green-100 text-green-800">6.2% eng.</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Marketing Digital</span>
                        <Badge className="bg-green-100 text-green-800">5.8% eng.</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Empreendedorismo</span>
                        <Badge className="bg-yellow-100 text-yellow-800">4.1% eng.</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recomendações</CardTitle>
                    <CardDescription>Sugestões para melhorar seu desempenho</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">Aumente a frequência</p>
                        <p className="text-xs text-blue-700">Posts às 9h têm 40% mais engajamento</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-900">Foque em produtividade</p>
                        <p className="text-xs text-green-700">Seus posts sobre produtividade têm melhor performance</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm font-medium text-purple-900">Use mais imagens</p>
                        <p className="text-xs text-purple-700">Posts com imagem têm 65% mais engajamento</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Crescimento do Público</CardTitle>
                    <CardDescription>Evolução dos seus seguidores</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Instagram</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">+18.2%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">LinkedIn</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">+12.4%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

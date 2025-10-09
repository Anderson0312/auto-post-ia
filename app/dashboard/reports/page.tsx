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
  Facebook,
  Twitter,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo } from "react"
import { usePosts, useSocialAccounts } from "@/hooks/use-api"
// removed duplicate import of Instagram/Linkedin/Facebook/Twitter
// import { Instagram, Linkedin, Facebook, Twitter } from "lucide-react"

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30days")

  const { data: posts, loading: postsLoading, error: postsError } = usePosts()
  const { data: accounts } = useSocialAccounts()

  const periodDays = useMemo(() => {
    switch (selectedPeriod) {
      case "7days":
        return 7
      case "90days":
        return 90
      case "1year":
        return 365
      case "30days":
      default:
        return 30
    }
  }, [selectedPeriod])

  const periodStart = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - periodDays)
    return d
  }, [periodDays])

  const publishedPosts = useMemo(() => {
    if (!posts) return []
    return posts.filter((p: any) => p.status === "published" && p.published_at && new Date(p.published_at) >= periodStart)
  }, [posts, periodStart])

  const totalEngagement = useMemo(() => {
    return publishedPosts.reduce((sum: number, p: any) => sum + (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0), 0)
  }, [publishedPosts])

  const totalReach = useMemo(() => {
    return publishedPosts.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0)
  }, [publishedPosts])

  const avgEngagementRate = useMemo(() => {
    if (publishedPosts.length === 0) return 0
    const sum = publishedPosts.reduce((s: number, p: any) => s + (parseFloat(p.engagement_rate) || 0), 0)
    return parseFloat((sum / publishedPosts.length).toFixed(2))
  }, [publishedPosts])

  function getPlatformMeta(platform?: string) {
    switch (platform) {
      case "instagram":
        return { icon: Instagram, color: "text-pink-600", label: "Instagram" }
      case "linkedin":
        return { icon: Linkedin, color: "text-blue-600", label: "LinkedIn" }
      case "facebook":
        return { icon: Facebook, color: "text-blue-700", label: "Facebook" }
      case "twitter":
        return { icon: Twitter, color: "text-black", label: "Twitter" }
      default:
        return { icon: Instagram, color: "text-gray-600", label: platform || "Desconhecido" }
    }
  }

  const platformAggregation = useMemo(() => {
    const byPlatform: Record<string, { posts: number; engagement: number; reach: number; engagementRate: number }> = {}
    publishedPosts.forEach((p: any) => {
      const platform = p.social_accounts?.platform || p.platform || "unknown"
      if (!byPlatform[platform]) byPlatform[platform] = { posts: 0, engagement: 0, reach: 0, engagementRate: 0 }
      byPlatform[platform].posts += 1
      byPlatform[platform].engagement += (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0)
      byPlatform[platform].reach += p.views_count || 0
      // média simples por plataforma
      const prevRate = byPlatform[platform].engagementRate
      const count = byPlatform[platform].posts
      const currentRate = parseFloat(p.engagement_rate) || 0
      byPlatform[platform].engagementRate = parseFloat(((prevRate * (count - 1) + currentRate) / count).toFixed(2))
    })
    return byPlatform
  }, [publishedPosts])

  const topPost = useMemo(() => {
    if (publishedPosts.length === 0) return null
    return publishedPosts.reduce((best: any, p: any) => {
      const e = (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0)
      if (!best) return p
      const be = (best.likes_count || 0) + (best.comments_count || 0) + (best.shares_count || 0)
      return e > be ? p : best
    }, null)
  }, [publishedPosts])

  const stats = useMemo(() => ({
    totalPosts: publishedPosts.length,
    totalEngagement,
    totalReach,
    avgEngagementRate,
    topPerformingPost: topPost?.content?.slice(0, 80) || "",
    growthRate: 0,
  }), [publishedPosts, totalEngagement, totalReach, avgEngagementRate, topPost])

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
            <Button onClick={() => alert("Relatório será exportado em PDF") }>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Loading / Error / Empty */}
        {postsLoading && (
          <div className="py-12 text-center text-gray-500">Carregando dados reais...</div>
        )}
        {!postsLoading && postsError && (
          <div className="py-12 text-center text-red-600">Erro ao carregar dados: {postsError}</div>
        )}
        {!postsLoading && !postsError && publishedPosts.length === 0 && (
          <div className="py-12 text-center text-gray-500">Nenhum post publicado no período selecionado.</div>
        )}

        {!postsLoading && !postsError && publishedPosts.length > 0 && (
          <div className="space-y-8">
            {/* Overview Stats reais */}
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
                    <span className="text-green-600">+0%</span>
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
                    <span className="text-green-600">+0%</span>
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
                    <span className="text-red-600">0%</span>
                    <span className="text-gray-500 ml-1">vs período anterior</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="platforms" className="space-y-6">
              <TabsList>
                <TabsTrigger value="platforms">Por Plataforma</TabsTrigger>
                <TabsTrigger value="posts">Posts Individuais</TabsTrigger>
              </TabsList>

              <TabsContent value="platforms" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {Object.entries(platformAggregation).map(([platform, agg]) => {
                    const meta = getPlatformMeta(platform)
                    return (
                      <Card key={platform}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <meta.icon className={`w-5 h-5 ${meta.color}`} />
                            {meta.label}
                          </CardTitle>
                          <CardDescription>
                            Desempenho nos últimos {selectedPeriod === "7days" ? "7 dias" : selectedPeriod === "30days" ? "30 dias" : selectedPeriod === "90days" ? "90 dias" : "1 ano"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Posts</p>
                              <p className="text-2xl font-bold">{agg.posts}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Engajamento</p>
                              <p className="text-2xl font-bold">{agg.engagement}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Alcance</p>
                              <p className="text-2xl font-bold">{agg.reach.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Taxa de Eng.</p>
                              <p className="text-2xl font-bold">{agg.engagementRate}%</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
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
                      {publishedPosts.map((post: any) => {
                        const platform = post.social_accounts?.platform || post.platform || "unknown"
                        const meta = getPlatformMeta(platform)
                        const dateStr = post.published_at ? new Date(post.published_at).toLocaleDateString("pt-BR") : "—"
                        const engagementRate = parseFloat(post.engagement_rate) || 0
                        return (
                          <div key={post.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <meta.icon className={`w-5 h-5 ${meta.color}`} />
                                <span className="font-medium">{meta.label}</span>
                                <Badge variant="outline">{dateStr}</Badge>
                                <Badge className={engagementRate > 5 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                  {engagementRate}% eng.
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{post.content}</p>
                            <div className="grid grid-cols-4 gap-4 pt-2 border-t">
                              <div className="flex items-center gap-2 text-sm">
                                <Eye className="w-4 h-4 text-gray-400" />
                                <span>{(post.views_count || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Heart className="w-4 h-4 text-red-400" />
                                <span>{post.likes_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <MessageCircle className="w-4 h-4 text-blue-400" />
                                <span>{post.comments_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Share className="w-4 h-4 text-green-400" />
                                <span>{post.shares_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

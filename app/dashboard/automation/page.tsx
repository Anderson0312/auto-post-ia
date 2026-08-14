"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, Play, Pause, RefreshCw, Plus, Trash2, Edit, ArrowLeft, Zap, Bot } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import Link from "next/link"
import { getPlatformMeta } from "@/lib/platform-meta"

interface AutomationStatus {
  status: string
  config?: {
    themes: string[]
    postsPerDay: number
    postTimes: string[]
    contentStyle: string
    generateImages: boolean
    postObjective: string
    language: string
    postFormat: string
  }
  stats?: {
    postsToday: number
    remainingPosts: number
    scheduledPosts: number
    connectedAccounts: number
  }
  nextExecution?: string
}

interface ScheduledPost {
  social_accounts: any
  id: string
  content: string
  platform: string
  scheduledFor: string
  status: string
  imageUrl?: string
  hashtags: string[]
}

export default function AutomationPage() {
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus | null>(null)
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [runningAutomation, setRunningAutomation] = useState(false)

  // Carregar dados
  useEffect(() => {
    loadAutomationData()
  }, [])

  const loadAutomationData = async () => {
    try {
      setLoading(true)

      // Carregar status da automação
      const statusResponse = await fetch('/api/automation/run')
      const statusData = await statusResponse.json()
      setAutomationStatus(statusData)

      // Carregar posts agendados
      const postsResponse = await fetch('/api/automation/schedule')
      const postsData = await postsResponse.json()
      setScheduledPosts(postsData.posts || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados da automação')
    } finally {
      setLoading(false)
    }
  }

  const runAutomation = async () => {
    try {
      setRunningAutomation(true)

      const response = await fetch('/api/automation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generateImage: true }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        await loadAutomationData() // Recarregar dados
      } else {
        toast.error(data.error || 'Erro ao executar automação')
      }
    } catch (error) {
      console.error('Erro ao executar automação:', error)
      toast.error('Erro ao executar automação')
    } finally {
      setRunningAutomation(false)
    }
  }

  const cancelPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/automation/posts/${postId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Post cancelado com sucesso')
        await loadAutomationData()
      } else {
        toast.error(data.error || 'Erro ao cancelar post')
      }
    } catch (error) {
      console.error('Erro ao cancelar post:', error)
      toast.error('Erro ao cancelar post')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Agendado' },
      published: { color: 'bg-green-100 text-green-800', label: 'Publicado' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Falhou' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelado' },
      processing: { color: 'bg-yellow-100 text-yellow-800', label: 'Processando' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled
    return <Badge className={config.color}>{config.label}</Badge>
  }

  // Componentes de Skeleton
  const StatsSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-4">
      {[
        { icon: Calendar, title: "Posts Hoje" },
        { icon: RefreshCw, title: "Restantes" },
        { icon: Clock, title: "Agendados" },
        { icon: Play, title: "Contas" }
      ].map(({ icon: Icon, title }, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Icon className="w-8 h-8 text-gray-300" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const ConfigSkeleton = () => (
    <Card>
      <CardHeader>
        <CardTitle>Configuração Atual</CardTitle>
        <CardDescription>
          Suas configurações de automação e próxima execução
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <div className="flex flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <div className="flex flex-wrap gap-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-12 rounded-full" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-8 w-36" />
        </div>
      </CardContent>
    </Card>
  )

  const PostsSkeleton = () => (
    <Card>
      <CardHeader>
        <CardTitle>Posts Agendados</CardTitle>
        <CardDescription>
          Gerencie seus posts agendados para publicação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const NotConfiguredSkeleton = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pause className="h-5 w-5 text-yellow-500" />
          Automação Não Configurada
        </CardTitle>
        <CardDescription>
          Configure a automação para começar a criar posts automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <ul className="list-disc list-inside space-y-2">
            {[...Array(3)].map((_, i) => (
              <li key={i}>
                <Skeleton className="h-4 w-64" />
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-5 h-5 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Voltar ao Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-blue-600" />
                <h1 className=" sm:inline text-xl font-bold text-gray-900">Automação de Posts</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-7" />
              <Skeleton className="h-8 w-7" />
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Description Skeleton */}
            <Skeleton className="h-4 w-96" />

            {/* Stats Skeleton */}
            <StatsSkeleton />

            {/* Config Skeleton */}
            <ConfigSkeleton />

            {/* Posts Skeleton */}
            <PostsSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Voltar ao Dashboard</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              <h1 className=" sm:inline text-xl font-bold text-gray-900">Automação de Posts</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" onClick={loadAutomationData} className="p-2">
              <RefreshCw className="w-5 h-5 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button onClick={runAutomation} disabled={runningAutomation} className="p-2">
              {runningAutomation ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-0 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Executando...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-0 sm:mr-2" />
                  <span className="hidden sm:inline">Executar Agora</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Description */}
          <div>
            <p className="text-muted-foreground">
              Gerencie a criação e publicação automática de posts nas suas redes sociais
            </p>
          </div>

          {/* Status da Automação */}
          {automationStatus?.status === 'not_configured' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pause className="h-5 w-5 text-yellow-500" />
                  Automação Não Configurada
                </CardTitle>
                <CardDescription>
                  Configure a automação para começar a criar posts automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Para usar a automação, você precisa:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Configurar temas e preferências de IA</li>
                    <li>Conectar pelo menos uma conta social</li>
                    <li>Definir horários de publicação</li>
                  </ul>
                  <div className="flex gap-2">
                    <Link href="/dashboard/ai-config">
                      <Button>Configurar IA</Button>
                    </Link>
                    <Link href="/dashboard/social-accounts">
                      <Button variant="outline">Conectar Contas</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Estatísticas */}
              <div className="grid gap-6 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Posts Hoje</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {automationStatus?.stats?.postsToday || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      de {automationStatus?.stats?.postsToday || 0} planejados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Restantes</CardTitle>
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {automationStatus?.stats?.remainingPosts || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      posts para hoje
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Agendados</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {automationStatus?.stats?.scheduledPosts || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      posts futuros
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Contas</CardTitle>
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {automationStatus?.stats?.connectedAccounts || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      contas conectadas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Configuração Atual */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuração Atual</CardTitle>
                  <CardDescription>
                    Suas configurações de automação e próxima execução
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium">Temas Configurados</h4>
                      <div className="flex flex-wrap gap-2">
                        {automationStatus?.config?.themes.map((theme, index) => (
                          <Badge key={index} variant="secondary">{theme}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Horários de Publicação</h4>
                      <div className="flex flex-wrap gap-2">
                        {automationStatus?.config?.postTimes.map((time, index) => (
                          <Badge key={index} variant="outline">{time}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Estilo de Conteúdo</h4>
                      <Badge variant="outline">{automationStatus?.config?.contentStyle}</Badge>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Objetivo</h4>
                      <Badge variant="outline">{automationStatus?.config?.postObjective}</Badge>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {automationStatus?.nextExecution}
                      </p>
                    </div>
                    <Link href="/dashboard/ai-config">
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Configuração
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Posts Agendados */}
          <Card>
            <CardHeader>
              <CardTitle>Posts Agendados</CardTitle>
              <CardDescription>
                Gerencie seus posts agendados para publicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledPosts.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">Nenhum post agendado</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Execute a automação para gerar posts automaticamente
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledPosts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            {(() => {
                              const { icon: Icon, color, label } = getPlatformMeta(post?.social_accounts?.platform || "");
                              return (
                                <>
                                  <Icon className={`w-4 h-4 ${color}`} />
                                  {label}
                                </>
                              );
                            })()}
                          </Badge>
                          {getStatusBadge(post.status)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Agendado para: {formatDate(post.scheduledFor)}</span>
                          {post.hashtags.length > 0 && (
                            <span>{post.hashtags.length} hashtags</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.status === 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelPost(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

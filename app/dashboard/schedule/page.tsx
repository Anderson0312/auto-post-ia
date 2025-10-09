"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  CalendarIcon,
  Clock,
  Instagram,
  Linkedin,
  Facebook,
  Twitter,
  Users,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { usePosts } from "@/hooks/use-api"
import { ptBR } from "date-fns/locale"
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format } from "date-fns"

// Helper para mapear plataforma -> ícone/cores/label
function getPlatformMeta(platform: string) {
  const key = String(platform || "").toLowerCase()
  switch (key) {
    case "instagram":
      return { icon: Instagram, color: "text-pink-600", label: "Instagram" }
    case "linkedin":
      return { icon: Linkedin, color: "text-blue-600", label: "LinkedIn" }
    case "facebook":
      return { icon: Facebook, color: "text-blue-700", label: "Facebook" }
    case "twitter":
      return { icon: Twitter, color: "text-black", label: "Twitter" }
    default:
      return { icon: Users, color: "text-gray-700", label: platform || "—" }
  }
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date())

  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  // Buscar posts reais do usuário
  const { data: postsResp, loading: loadingPosts } = usePosts()

  const posts = useMemo(() => {
    return Array.isArray(postsResp as any) ? (postsResp as any) : []
  }, [postsResp])

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

  // Filtra posts pela data selecionada (usa scheduled_for ou published_at)
  const getPostsForDate = (date: string) => {
    return posts.filter((p: any) => {
      const sched = p.scheduled_for ? new Date(p.scheduled_for) : null
      const pub = p.published_at ? new Date(p.published_at) : null
      const dStr = (d: Date) => d.toISOString().split("T")[0]
      return (
        (sched && dStr(sched) === date) || (pub && dStr(pub) === date)
      )
    })
  }

  const formatSelectedDateLabel = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (iso?: string | null) => {
    if (!iso) return "—"
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    } catch {
      return "—"
    }
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
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Calendário de Posts</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calendar">Visualização em Calendário</TabsTrigger>
            <TabsTrigger value="list">Lista de Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Calendar */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Calendário</CardTitle>
                  <CardDescription>Selecione uma data para ver os posts agendados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <button onClick={prevMonth} className="h-7 w-7 rounded-md border text-gray-600 hover:bg-gray-100 flex items-center justify-center">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="text-sm font-medium">
                        {format(currentMonth, "LLLL yyyy", { locale: ptBR })}
                      </div>
                      <button onClick={nextMonth} className="h-7 w-7 rounded-md border text-gray-600 hover:bg-gray-100 flex items-center justify-center">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((w) => (
                        <div key={w} className="py-1 font-normal">{w}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {days.map((day) => {
                        const isOutside = !isSameMonth(day, currentMonth)
                        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={[
                              "aspect-square w-full rounded-md text-sm flex items-center justify-center",
                              isOutside ? "text-muted-foreground opacity-50" : "text-gray-900",
                              isSelected ? "bg-blue-600 text-white" : "hover:bg-gray-100",
                            ].join(" ")}
                            aria-label={format(day, "PPP", { locale: ptBR })}
                          >
                            {format(day, "d", { locale: ptBR })}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Posts for Selected Date */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    Posts para {selectedDate ? formatSelectedDateLabel(selectedDate.toISOString().split("T")[0]) : "hoje"}
                  </CardTitle>
                  <CardDescription>
                    {selectedDate ? getPostsForDate(selectedDate.toISOString().split("T")[0]).length : 0} posts agendados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loadingPosts ? (
                      <div className="text-center py-8 text-gray-500">Carregando…</div>
                    ) : selectedDate && getPostsForDate(selectedDate.toISOString().split("T")[0]).length > 0 ? (
                      getPostsForDate(selectedDate.toISOString().split("T")[0]).map((post: any) => {
                        const platform = post.social_accounts?.platform || post.platform
                        const { icon: Icon, color, label } = getPlatformMeta(platform)
                        const time = post.status === "published" ? formatTime(post.published_at) : formatTime(post.scheduled_for)
                        return (
                          <div key={post.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 ${color}`} />
                                <span className="font-medium">{label}</span>
                                <Badge variant="outline">{time}</Badge>
                                {getStatusBadge(post.status)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{post.content}</p>
                            {post.image_url && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                                {post.status === "scheduled" ? "Imagem será gerada automaticamente" : "Imagem incluída"}
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum post para esta data</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Posts</CardTitle>
                <CardDescription>Lista completa de posts agendados, publicados e com falha</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingPosts && (
                    <div className="text-center py-8 text-gray-500">Carregando…</div>
                  )}
                  {!loadingPosts && posts.map((post: any) => {
                    const platform = post.social_accounts?.platform || post.platform
                    const { icon: Icon, color, label } = getPlatformMeta(platform)
                    const dateLabel = (() => {
                      const d = post.status === "published" ? post.published_at : post.scheduled_for
                      if (!d) return "—"
                      const date = new Date(d)
                      return `${date.toLocaleDateString("pt-BR", { dateStyle: "medium" })} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                    })()
                    return (
                      <div key={post.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${color}`} />
                            <span className="font-medium">{label}</span>
                            <Badge variant="outline">{dateLabel}</Badge>
                            {getStatusBadge(post.status)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {post.status === "scheduled" && (
                              <>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{post.content}</p>
                        {post.image_url && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-3 h-3 bg-gray-300 rounded"></div>
                            {post.status === "scheduled" ? "Imagem será gerada automaticamente" : "Imagem incluída"}
                          </div>
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

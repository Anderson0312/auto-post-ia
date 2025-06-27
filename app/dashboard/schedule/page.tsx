"use client"

import { useState } from "react"
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
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import Link from "next/link"

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const [scheduledPosts] = useState([
    {
      id: 1,
      date: "2024-01-16",
      time: "09:00",
      platform: "Instagram",
      icon: Instagram,
      color: "text-pink-600",
      content: "Dicas de produtividade para começar a semana com energia! ✨ Como você organiza suas tarefas?",
      status: "scheduled",
      image: true,
    },
    {
      id: 2,
      date: "2024-01-16",
      time: "15:00",
      platform: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-600",
      content: "A importância da automação no marketing digital moderno. Veja como a IA está transformando...",
      status: "scheduled",
      image: true,
    },
    {
      id: 3,
      date: "2024-01-17",
      time: "09:00",
      platform: "Instagram",
      icon: Instagram,
      color: "text-pink-600",
      content: "Tendências de design que vão dominar 2024. Qual é a sua favorita?",
      status: "scheduled",
      image: true,
    },
    {
      id: 4,
      date: "2024-01-15",
      time: "15:00",
      platform: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-600",
      content: "Como construir uma marca pessoal forte nas redes sociais...",
      status: "published",
      image: true,
    },
    {
      id: 5,
      date: "2024-01-15",
      time: "09:00",
      platform: "Instagram",
      icon: Instagram,
      color: "text-pink-600",
      content: "Motivação para segunda-feira! Qual é o seu objetivo da semana?",
      status: "failed",
      image: false,
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

  const getPostsForDate = (date: string) => {
    return scheduledPosts.filter((post) => post.date === date)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              {/* Posts for Selected Date */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    Posts para {selectedDate ? formatDate(selectedDate.toISOString().split("T")[0]) : "hoje"}
                  </CardTitle>
                  <CardDescription>
                    {selectedDate ? getPostsForDate(selectedDate.toISOString().split("T")[0]).length : 0} posts
                    agendados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedDate && getPostsForDate(selectedDate.toISOString().split("T")[0]).length > 0 ? (
                      getPostsForDate(selectedDate.toISOString().split("T")[0]).map((post) => (
                        <div key={post.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <post.icon className={`w-5 h-5 ${post.color}`} />
                              <span className="font-medium">{post.platform}</span>
                              <Badge variant="outline">{post.time}</Badge>
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
                          {post.image && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <div className="w-3 h-3 bg-gray-300 rounded"></div>
                              Imagem será gerada automaticamente
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum post agendado para esta data</p>
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
                  {scheduledPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <post.icon className={`w-5 h-5 ${post.color}`} />
                          <span className="font-medium">{post.platform}</span>
                          <Badge variant="outline">
                            {formatDate(post.date)} às {post.time}
                          </Badge>
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
                      {post.image && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <div className="w-3 h-3 bg-gray-300 rounded"></div>
                          {post.status === "scheduled" ? "Imagem será gerada automaticamente" : "Imagem incluída"}
                        </div>
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

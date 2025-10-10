"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Bot,
  Plus,
  X,
  Clock,
  Target,
  Palette,
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  Users,
  ShoppingCart,
  Save,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

export default function AIConfigPage() {
  const [themes, setThemes] = useState<string[]>(["Produtividade e organização", "Marketing digital", "Empreendedorismo"])
  const [newTheme, setNewTheme] = useState("")
  const [postsPerDay, setPostsPerDay] = useState([2])
  const [postTimes, setPostTimes] = useState<string[]>(["09:00", "15:00"])
  const [contentStyle, setContentStyle] = useState("professional")
  const [generateImages, setGenerateImages] = useState(true)
  const [postObjective, setPostObjective] = useState("engagement")
  const [customInstructions, setCustomInstructions] = useState("")
  const [language, setLanguage] = useState("pt-BR")
  const [postFormat, setPostFormat] = useState("medium")

  const [loading, setLoading] = useState(false)
  const [generatingInstructions, setGeneratingInstructions] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Buscar config ao montar
  useEffect(() => {
    setLoading(true)
    setError("")
    setSuccess("")
    apiClient.getAIConfig()
      .then((data) => {
        if (data && data.config) {
          setThemes(data.config.themes || [])
          setPostsPerDay([data.config.posts_per_day || 2])
          setPostTimes(data.config.post_times || ["09:00", "15:00"])
          setContentStyle(data.config.content_style || "professional")
          setGenerateImages(Boolean(data.config.generate_images))
          setPostObjective(data.config.post_objective || "engagement")
          setCustomInstructions(data.config.custom_instructions || "")
          setLanguage(data.config.language || "pt-BR")
          setPostFormat(data.config.post_format || "medium")
        }
      })
      .catch(() => setError("Erro ao carregar configurações"))
      .finally(() => setLoading(false))
  }, [])

  const addTheme = () => {
    if (newTheme.trim() && !themes.includes(newTheme.trim())) {
      setThemes([...themes, newTheme.trim()])
      setNewTheme("")
    }
  }

  const removeTheme = (themeToRemove: string) => {
    setThemes(themes.filter((theme) => theme !== themeToRemove))
  }

  const addPostTime = () => {
    if (postTimes.length < 5) {
      setPostTimes([...postTimes, "12:00"])
    }
  }

  const updatePostTime = (index: number, time: string) => {
    const newTimes = [...postTimes]
    newTimes[index] = time
    setPostTimes(newTimes)
  }

  const removePostTime = (index: number) => {
    if (postTimes.length > 1) {
      setPostTimes(postTimes.filter((_, i) => i !== index))
    }
  }

  const generateCustomInstructions = async () => {
    try {
      setGeneratingInstructions(true)
      toast.info("Gerando instruções personalizadas...")
      
      // Construindo o prompt com base nas configurações atuais
      const prompt = `Crie instruções personalizadas detalhadas para uma IA que gera posts para redes sociais com as seguintes características:
      - Temas: ${themes.join(", ")}
      - Estilo de conteúdo: ${contentStyle}
      - Objetivo principal: ${postObjective === "engagement" ? "Engajamento" : postObjective === "awareness" ? "Awareness" : "Vendas"}
      - Formato dos posts: ${postFormat === "short" ? "Curto" : postFormat === "medium" ? "Médio" : "Longo"}
      - Idioma: ${language === "pt-BR" ? "Português (Brasil)" : language === "en-US" ? "Inglês (EUA)" : "Espanhol"}
      
      As instruções devem ser específicas, detalhadas e incluir diretrizes sobre tom de voz, uso de emojis, estrutura dos posts, elementos a incluir ou evitar, e qualquer outra orientação relevante para criar posts eficazes.`
      
      const response = await apiClient.generateAIText({
        prompt: prompt,
        max_tokens: 500
      })
      
      if (response && response.text) {
        setCustomInstructions(response.text)
        toast.success("Instruções personalizadas geradas com sucesso!")
      } else {
        toast.error("Erro ao gerar instruções personalizadas")
      }
    } catch (error) {
      console.error("Erro ao gerar instruções:", error)
      toast.error("Erro ao gerar instruções personalizadas")
    } finally {
      setGeneratingInstructions(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      await apiClient.updateAIConfig({
        themes,
        posts_per_day: postsPerDay[0],
        post_times: postTimes,
        content_style: contentStyle,
        generate_images: generateImages,
        post_objective: postObjective,
        custom_instructions: customInstructions,
        language,
        post_format: postFormat,
      })
      setSuccess("Configurações salvas com sucesso!")
    } catch (e: any) {
      setError(e?.message || "Erro ao salvar configurações")
    } finally {
      setLoading(false)
    }
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
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-600" />
              <h1 className="sm:inline text-xl font-bold text-gray-900">Configuração da IA</h1>
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading} className="p-2">
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 mr-0 sm:mr-2 animate-spin" />
                <span className="hidden sm:inline">Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Salvar Configurações</span>
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}
        {loading && !success && !error && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">Carregando...</div>
        )}
        <div className="space-y-8">
          {/* Temas e Assuntos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Temas e Assuntos
              </CardTitle>
              <CardDescription>Defina os temas que a IA deve abordar nos seus posts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {themes.map((theme, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {theme}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-auto p-0 hover:bg-transparent"
                      onClick={() => removeTheme(theme)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Digite um novo tema..."
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTheme()}
                />
                <Button onClick={addTheme}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-sm text-gray-500">
                Exemplos: "Dicas de produtividade", "Tendências de design", "Receitas saudáveis"
              </div>
            </CardContent>
          </Card>

          {/* Frequência e Horários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Frequência e Horários
              </CardTitle>
              <CardDescription>Configure quando e quantas vezes postar por dia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Posts por dia: {postsPerDay[0]}</Label>
                <Slider
                  value={postsPerDay}
                  onValueChange={setPostsPerDay}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-sm text-gray-500">
                  Recomendamos entre 1-3 posts por dia para melhor engajamento
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Horários de postagem</Label>
                  <Button variant="outline" size="sm" onClick={addPostTime}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar horário
                  </Button>
                </div>

                <div className="grid gap-3">
                  {postTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => updatePostTime(index, e.target.value)}
                        className="w-32"
                      />
                      {postTimes.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removePostTime(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objetivo dos Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Objetivo dos Posts
              </CardTitle>
              <CardDescription>Defina o principal objetivo dos seus posts</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={postObjective} onValueChange={setPostObjective}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagement">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Engajamento - Curtidas, comentários e compartilhamentos
                    </div>
                  </SelectItem>
                  <SelectItem value="awareness">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Awareness - Aumentar conhecimento da marca
                    </div>
                  </SelectItem>
                  <SelectItem value="sales">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Vendas - Gerar leads e conversões
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Estilo do Conteúdo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                Estilo do Conteúdo
              </CardTitle>
              <CardDescription>Personalize o tom e estilo dos seus posts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Tom de voz</Label>
                <Select value={contentStyle} onValueChange={setContentStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profissional e formal</SelectItem>
                    <SelectItem value="casual">Casual e descontraído</SelectItem>
                    <SelectItem value="friendly">Amigável e próximo</SelectItem>
                    <SelectItem value="authoritative">Autoritativo e especialista</SelectItem>
                    <SelectItem value="inspirational">Inspiracional e motivador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Gerar imagens automaticamente</Label>
                  <p className="text-sm text-gray-500">A IA criará imagens relacionadas ao conteúdo do post</p>
                </div>
                <Switch checked={generateImages} onCheckedChange={setGenerateImages} />
              </div>
            </CardContent>
          </Card>

          {/* Instruções Personalizadas */}
          <Card>
            <CardHeader>
              <CardTitle>Instruções Personalizadas</CardTitle>
              <CardDescription>Adicione instruções específicas para a IA seguir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Ex: Sempre incluir uma pergunta no final do post, usar emojis moderadamente, mencionar a marca sutilmente..."
                  className="min-h-[100px]"
                  value={customInstructions}
                  onChange={e => setCustomInstructions(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Seja específico sobre o que você quer que a IA faça ou evite
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => generateCustomInstructions()}
                    disabled={loading || generatingInstructions}
                    className="flex items-center gap-2"
                  >
                    <Bot className="w-4 h-4" />
                    {generatingInstructions ? "Gerando..." : "Gerar com IA"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Idioma e Formato do Post */}
          <Card>
            <CardHeader>
              <CardTitle>Idioma e Formato</CardTitle>
              <CardDescription>Escolha o idioma e o formato dos posts gerados</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label>Idioma</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">Inglês (EUA)</SelectItem>
                    <SelectItem value="es-ES">Espanhol (Espanha)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Formato do Post</Label>
                <Select value={postFormat} onValueChange={setPostFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Curto</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="long">Longo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview da Configuração</CardTitle>
              <CardDescription>Veja como ficará sua configuração atual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Temas:</strong> {themes.join(", ")}
                </div>
                <div>
                  <strong>Posts por dia:</strong> {postsPerDay[0]}
                </div>
                <div>
                  <strong>Horários:</strong> {postTimes.join(", ")}
                </div>
                <div>
                  <strong>Objetivo:</strong>{" "}
                  {postObjective === "engagement"
                    ? "Engajamento"
                    : postObjective === "awareness"
                      ? "Awareness"
                      : "Vendas"}
                </div>
                <div>
                  <strong>Tom:</strong> {contentStyle}
                </div>
                <div>
                  <strong>Imagens:</strong> {generateImages ? "Sim" : "Não"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Play, ArrowRight, Info, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function DemoPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { loginDemo, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Se já estiver logado, redirecionar para o dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const startDemo = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Login automático com usuário demo
      await loginDemo()

      toast({
        title: "Bem-vindo à demonstração!",
        description: "Explore todas as funcionalidades do AutoPostIA",
      })

      // Redirecionar para dashboard após um pequeno delay
      setTimeout(() => {
        router.push("/dashboard?demo=true")
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao iniciar demonstração"
      setError(errorMessage)
      toast({
        title: "Erro na demonstração",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AutoPostIA</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Play className="w-4 h-4 mr-1" />
            Demonstração Interativa
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Explore o AutoPostIA em Ação</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Veja como nossa IA pode automatizar suas redes sociais. Esta demonstração usa dados reais para mostrar todas
            as funcionalidades da plataforma.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <Info className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Demo Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />O que você verá na demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Dashboard Completo</p>
                  <p className="text-sm text-gray-600">Métricas reais de engajamento e performance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Posts Automatizados</p>
                  <p className="text-sm text-gray-600">Veja posts já criados pela IA</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Redes Sociais Conectadas</p>
                  <p className="text-sm text-gray-600">Instagram e LinkedIn já configurados</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Configurações de IA</p>
                  <p className="text-sm text-gray-600">Temas e horários já definidos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Relatórios Detalhados</p>
                  <p className="text-sm text-gray-600">Analytics e insights de performance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-green-600" />
                Dados da demonstração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-medium text-green-900 mb-2">Conta Demo Configurada</p>
                <div className="space-y-2 text-sm text-green-800">
                  <p>• 24 posts criados este mês</p>
                  <p>• Instagram e LinkedIn conectados</p>
                  <p>• 3 temas de IA configurados</p>
                  <p>• 1.2K de engajamento total</p>
                  <p>• 94% de taxa de sucesso</p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Esta é uma conta de demonstração com dados fictícios. Você pode explorar todas as funcionalidades sem
                  limitações.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Start Demo Button */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-4">Pronto para começar?</h3>
              <p className="text-gray-600 mb-6">
                Clique no botão abaixo para acessar automaticamente a conta demo e explorar o AutoPostIA.
              </p>

              <Button onClick={startDemo} disabled={isLoading} size="lg" className="w-full mb-4">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando demonstração...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Demonstração
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500">
                Não é necessário cadastro. Acesso instantâneo à plataforma completa.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">Gostou da demonstração?</h3>
          <p className="text-gray-600 mb-6">
            Crie sua conta gratuita e comece a automatizar suas próprias redes sociais
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">
                Criar Conta Gratuita
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

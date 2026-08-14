import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
 import { Badge } from "@/components/ui/badge"
import { Bot, Calendar, BarChart3, Users, Zap, Shield, Globe, Sparkles, Instagram, Facebook, Linkedin, Twitter, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AutoPostIA</span>
          </div>
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4" variant="secondary">
          <Sparkles className="w-4 h-4 mr-1" />
          Powered by AI
        </Badge>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Crie <span className="text-blue-600">vídeos curtos virais</span>
          <br />
          com Inteligência Artificial
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          TikTok, YouTube Shorts e Reels. Avatar, roteiro, cenas e vídeo 9:16 — o primeiro teste é crescer uma conta do zero só com o SaaS.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="px-8">
              Começar Gratuitamente
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="px-8">
              Ver Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Tudo que você precisa para automatizar suas redes sociais
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Uma plataforma completa para criar, agendar e analisar seu conteúdo em redes sociais
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Bot className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>IA Avançada</CardTitle>
              <CardDescription>
                Geração automática de textos e imagens personalizados para cada rede social
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Calendar className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Agendamento Inteligente</CardTitle>
              <CardDescription>Publique no melhor horário automaticamente com base no seu público</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>Relatórios Detalhados</CardTitle>
              <CardDescription>Acompanhe o desempenho das suas publicações com métricas em tempo real</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Users className="w-12 h-12 text-orange-600 mb-4" />
              <CardTitle>Múltiplas Redes</CardTitle>
              <CardDescription>
                Conecte Instagram, Facebook, LinkedIn, Twitter e Threads em uma só plataforma
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Zap className="w-12 h-12 text-yellow-600 mb-4" />
              <CardTitle>Automação Total</CardTitle>
              <CardDescription>
                Configure uma vez e deixe a IA trabalhar 24/7 criando conteúdo para você
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Shield className="w-12 h-12 text-red-600 mb-4" />
              <CardTitle>Seguro e Confiável</CardTitle>
              <CardDescription>Seus dados e tokens de acesso protegidos com criptografia de ponta</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Social Networks */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Conecte todas as suas redes sociais</h2>
          <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
            Publique simultaneamente em todas as principais plataformas
          </p>

          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              Instagram
            </div>
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Facebook className="w-5 h-5 text-white" />
              </div>
              Facebook
            </div>
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-white" />
              </div>
              LinkedIn
            </div>
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Twitter className="w-5 h-5 text-white" />
              </div>
              Twitter
            </div>
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              Threads
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-3xl mx-auto border-0 shadow-xl bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Veja o AutoPostIA em Ação</h2>
            <p className="text-green-100 mb-8 text-lg">
              Explore nossa demonstração interativa com dados reais. Veja como a IA cria conteúdo, agenda posts e gera
              relatórios detalhados.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" variant="secondary" className="px-8">
                  Explorar Demonstração
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 border-white  text-black hover:text-green-600"
                >
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold mb-4">Pronto para automatizar suas redes sociais?</h2>
            <p className="text-blue-100 mb-8">
              Comece gratuitamente e veja como a IA pode transformar sua presença digital
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="px-8">
                Começar Agora - É Grátis
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              <span className="text-xl font-bold">AutoPostIA</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <Link href="/terms" className="hover:text-white">Termos de Serviço</Link>
              <Link href="/privacy" className="hover:text-white">Política de Privacidade</Link>
              <Link href="/exclusao-de-dados" className="hover:text-white">Exclusão de dados</Link>
              <span>© 2026 AutoPostIA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

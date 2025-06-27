"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  Trash2,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      platform: "Instagram",
      username: "@meuinstagram",
      connected: true,
      active: true,
      icon: Instagram,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      followers: "2.5K",
      lastPost: "2 horas atrás",
    },
    {
      id: 2,
      platform: "LinkedIn",
      username: "Meu Perfil LinkedIn",
      connected: true,
      active: true,
      icon: Linkedin,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      followers: "1.2K",
      lastPost: "1 dia atrás",
    },
    {
      id: 3,
      platform: "Facebook",
      username: "",
      connected: false,
      active: false,
      icon: Facebook,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      followers: "-",
      lastPost: "-",
    },
    {
      id: 4,
      platform: "Twitter",
      username: "",
      connected: false,
      active: false,
      icon: Twitter,
      color: "text-black",
      bgColor: "bg-gray-50",
      followers: "-",
      lastPost: "-",
    },
  ])

  const toggleAccountActive = (accountId: number) => {
    setAccounts(
      accounts.map((account) => (account.id === accountId ? { ...account, active: !account.active } : account)),
    )
  }

  const connectAccount = (platform: string) => {
    // Simular conexão
    alert(`Conectando com ${platform}...`)
  }

  const disconnectAccount = (accountId: number) => {
    if (confirm("Tem certeza que deseja desconectar esta conta?")) {
      setAccounts(
        accounts.map((account) =>
          account.id === accountId
            ? { ...account, connected: false, active: false, username: "", followers: "-", lastPost: "-" }
            : account,
        ),
      )
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
              <Plus className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Contas de Redes Sociais</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Conecte suas redes sociais para começar a automatizar suas publicações. Seus dados de login são protegidos
              com criptografia de ponta.
            </AlertDescription>
          </Alert>

          {/* Connected Accounts Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{accounts.filter((acc) => acc.connected).length}</p>
                  <p className="text-sm text-gray-600">Contas Conectadas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{accounts.filter((acc) => acc.active).length}</p>
                  <p className="text-sm text-gray-600">Contas Ativas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {accounts
                      .filter((acc) => acc.connected)
                      .reduce((total, acc) => {
                        const followers = acc.followers.replace("K", "000").replace(".", "")
                        return total + (followers !== "-" ? Number.parseInt(followers) : 0)
                      }, 0)
                      .toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total de Seguidores</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accounts List */}
          <div className="space-y-4">
            {accounts.map((account) => (
              <Card key={account.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${account.bgColor}`}>
                        <account.icon className={`w-6 h-6 ${account.color}`} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{account.platform}</h3>
                          {account.connected ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Conectado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Não conectado</Badge>
                          )}
                        </div>

                        {account.connected ? (
                          <div className="text-sm text-gray-600">
                            <p>{account.username}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span>{account.followers} seguidores</span>
                              <span>Último post: {account.lastPost}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Conecte sua conta para começar a automatizar</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {account.connected ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Ativo</span>
                            <Switch checked={account.active} onCheckedChange={() => toggleAccountActive(account.id)} />
                          </div>

                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Configurar
                          </Button>

                          <Button variant="outline" size="sm" onClick={() => disconnectAccount(account.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Desconectar
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => window.location.href = "/api/auth/instagram"}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Conectar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>Como conectar suas contas</CardTitle>
              <CardDescription>Siga estes passos para conectar suas redes sociais com segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Instagram</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Clique em "Conectar" ao lado do Instagram</li>
                    <li>Faça login na sua conta Instagram</li>
                    <li>Autorize o AutoPostIA a publicar em seu nome</li>
                    <li>Confirme a conexão</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">LinkedIn</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Clique em "Conectar" ao lado do LinkedIn</li>
                    <li>Entre com suas credenciais do LinkedIn</li>
                    <li>Permita acesso para publicações</li>
                    <li>Verifique se a conexão foi bem-sucedida</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Facebook</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Clique em "Conectar" ao lado do Facebook</li>
                    <li>Faça login no Facebook</li>
                    <li>Selecione a página que deseja conectar</li>
                    <li>Autorize as permissões necessárias</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Twitter</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Clique em "Conectar" ao lado do Twitter</li>
                    <li>Autorize o aplicativo no Twitter</li>
                    <li>Confirme as permissões de postagem</li>
                    <li>Teste a conexão</li>
                  </ol>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Segurança:</strong> Todas as conexões são feitas através de OAuth 2.0, o padrão de segurança
                  da indústria. Nunca armazenamos suas senhas.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

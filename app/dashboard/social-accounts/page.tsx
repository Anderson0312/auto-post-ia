"use client"

import { useMemo, useState } from "react"
import { useSocialAccounts } from "@/hooks/use-api"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
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
  const { data, loading, error, refetch } = useSocialAccounts()
  const { toast } = useToast()
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  const accounts = useMemo(() => {
    const base = [
      { id: 1, platform: "Instagram", slug: "instagram", icon: Instagram, color: "text-pink-600", bgColor: "bg-pink-50" },
      { id: 2, platform: "LinkedIn", slug: "linkedin", icon: Linkedin, color: "text-blue-600", bgColor: "bg-blue-50" },
      { id: 3, platform: "Facebook", slug: "facebook", icon: Facebook, color: "text-blue-700", bgColor: "bg-blue-50" },
      { id: 4, platform: "Twitter", slug: "twitter", icon: Twitter, color: "text-black", bgColor: "bg-gray-50" },
    ] as const

    const dbList: any[] = Array.isArray((data as any)?.accounts) ? (data as any).accounts : []

    const formatLastPost = (iso?: string | null) => {
      if (!iso) return "-"
      try {
        const d = new Date(iso)
        if (Number.isNaN(d.getTime())) return "-"
        return d.toLocaleString()
      } catch {
        return "-"
      }
    }

    const list = base.map((p) => {
      const match = dbList.find((a) => (a.platform || "").toLowerCase() === p.slug)
      const connected = !!match && !!match.is_connected
      const active = !!match && !!match.is_active
      const rawUser = (match?.username || "").trim()
      const name = (match?.display_name || "").trim()
      let display = ""
      if (p.slug === "twitter") {
        // Preferir @username; evitar exibir apenas ID numérico
        if (rawUser && !/^\d+$/.test(rawUser)) {
          display = `@${rawUser}`
        } else {
          display = name
        }
      } else {
        display = name || rawUser
      }
      const followers =
        typeof match?.followers_count === "number" && match.followers_count > 0 ? `${match.followers_count}` : "-"
      const lastPost = formatLastPost(match?.last_post_at)

      return {
        id: match?.id ?? p.id,
        platform: p.platform,
        username: display,
        connected,
        active,
        icon: p.icon,
        color: p.color,
        bgColor: p.bgColor,
        followers,
        lastPost,
      }
    })

    // Ordenar: conectadas primeiro, depois ativas
    return list.sort((a, b) => {
      const byConnected = Number(b.connected) - Number(a.connected)
      if (byConnected !== 0) return byConnected
      return Number(b.active) - Number(a.active)
    })
  }, [data])

  const toggleAccountActive = async (accountId: number, active: boolean) => {
    try {
      await apiClient.toggleSocialAccount(String(accountId), active)
      await refetch()
      toast({ title: "Status atualizado", description: `Conta ${active ? "ativada" : "desativada"}` })
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível atualizar o status", variant: "destructive" })
    }
  }

  const disconnectAccount = async (accountId: number) => {
    if (confirm("Tem certeza que deseja desconectar esta conta?")) {
      try {
        await apiClient.disconnectSocialAccount(String(accountId))
        await refetch()
        toast({ title: "Conta desconectada", description: "A conta foi desconectada com sucesso" })
      } catch (err) {
        toast({ title: "Erro", description: "Não foi possível desconectar a conta", variant: "destructive" })
      }
    }
  }

  const humanizeFollowersRefreshReason = (reason?: string) => {
    switch (reason) {
      case "instagram_graph_unavailable_or_permissions":
        return "Instagram requer conta Business/Creator e permissões corretas."
      case "missing_token_or_platform_user_id":
        return "A conta não possui token ou ID da plataforma."
      case "linkedin_not_supported_for_personal_profiles":
      case "linkedin_not_support_for_personal_profiles":
        return "LinkedIn não fornece contagem de seguidores para perfis pessoais."
      case "facebook_requires_page_token_and_graph_endpoint":
        return "Facebook requer token de página e Graph API (Page)."
      case "twitter_not_supported_without_enterprise_api":
        return "Twitter/X requer API paga."
      case "platform_not_supported":
        return "Plataforma não suportada no momento."
      default:
        return "Não foi possível atualizar seguidores."
    }
  }

  const refreshFollowers = async (accountId: string) => {
    try {
      setRefreshingId(accountId)
      const res = await apiClient.refreshFollowersCount(accountId)
      await refetch()
      const followers = typeof res?.followers_count === "number" ? res.followers_count : undefined
      const msg = res?.updated
        ? `Seguidores atualizados: ${followers}`
        : `Sem atualização: ${humanizeFollowersRefreshReason(res?.reason)}`
      toast({ title: "Atualizar seguidores", description: msg })
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao atualizar seguidores", variant: "destructive" })
    } finally {
      setRefreshingId(null)
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
                        const followers = acc.followers?.toString().replace("K", "000").replace(".", "")
                        return total + (followers && followers !== "-" ? Number.parseInt(followers) : 0)
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
                            <Switch
                              checked={account.active}
                              onCheckedChange={(val) => toggleAccountActive(Number(account.id), val)}
                            />
                          </div>

                          {/* <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Configurar
                          </Button> */}

                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={!account.connected || refreshingId === String(account.id)}
                            onClick={() => refreshFollowers(String(account.id))}
                          >
                            {refreshingId === String(account.id) ? "Atualizando..." : "Atualizar seguidores"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => disconnectAccount(account.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Desconectar
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => {
                            const token = apiClient.getToken() || ""
                            const slug = account.platform.toLowerCase()
                            const url = `/api/auth/${slug}?token=${encodeURIComponent(token)}`
                            window.location.href = url
                          }}
                        >
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

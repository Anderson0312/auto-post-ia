"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { useUserPlan } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Trash2,
  Save,
  AlertTriangle,
  Crown,
  Mail,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { data: userPlan, loading: planLoading } = useUserPlan()
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
    postFormat: "medium",
    bio: "",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    postSuccess: true,
    postFailure: true,
    weeklyReport: true,
    monthlyReport: false,
    systemUpdates: true,
    marketingEmails: false,
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: "24h",
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  
  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        timezone: user.timezone || "America/Sao_Paulo",
        language: user.language || "pt-BR",
        postFormat: user.post_format || "medium",
        bio: user.bio || "",
      })
    }
  }, [user])

  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true)
      await updateUser({
        name: profileData.name,
        phone: profileData.phone,
        timezone: profileData.timezone,
        language: profileData.language,
        post_format: profileData.postFormat,
        bio: profileData.bio,
      })
      toast.success("Perfil atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      toast.error("Erro ao atualizar perfil. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    try {
      setIsLoading(true)
      // Implementação real seria feita aqui
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success("Configurações de notificação atualizadas!")
    } catch (error) {
      toast.error("Erro ao atualizar notificações. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem!")
      return
    }
    
    try {
      setIsLoading(true)
      
      // Implementação real da mudança de senha
      await apiClient.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast.success("Senha alterada com sucesso!")
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      toast.error("Erro ao alterar senha. Verifique sua senha atual e tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = () => {
    if (confirm("Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.")) {
      toast.success("Solicitação de exclusão de conta enviada. Você receberá um email de confirmação.")
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
              <Settings className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Plano
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Avançado
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Atualize suas informações básicas de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso horário</Label>
                    <Select
                      value={profileData.timezone}
                      onValueChange={(value) => setProfileData({ ...profileData, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tóquio (GMT+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Conte um pouco sobre você..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-gray-500">{profileData.bio.length}/500 caracteres</p>
                </div>

                <Button onClick={handleProfileUpdate} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Salvando..." : "Salvar alterações"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferências de Conteúdo</CardTitle>
                <CardDescription>Configure como a IA deve gerar seus posts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma dos posts</Label>
                    <Select
                      value={profileData.language}
                      onValueChange={(value) => setProfileData({ ...profileData, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                        <SelectItem value="fr-FR">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postFormat">Formato dos posts</Label>
                    <Select
                      value={profileData.postFormat}
                      onValueChange={(value) => setProfileData({ ...profileData, postFormat: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Curto (até 100 caracteres)</SelectItem>
                        <SelectItem value="medium">Médio (100-300 caracteres)</SelectItem>
                        <SelectItem value="long">Longo (300+ caracteres)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notificações por E-mail</CardTitle>
                <CardDescription>Configure quando você quer receber e-mails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Notificações gerais</Label>
                      <p className="text-sm text-gray-500">Receber e-mails sobre atividades da conta</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Posts publicados com sucesso</Label>
                      <p className="text-sm text-gray-500">Confirmar quando posts foram publicados</p>
                    </div>
                    <Switch
                      checked={notificationSettings.postSuccess}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, postSuccess: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Falhas na publicação</Label>
                      <p className="text-sm text-gray-500">Alertar quando posts falharem</p>
                    </div>
                    <Switch
                      checked={notificationSettings.postFailure}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, postFailure: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Relatório semanal</Label>
                      <p className="text-sm text-gray-500">Resumo semanal de performance</p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReport}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, weeklyReport: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Relatório mensal</Label>
                      <p className="text-sm text-gray-500">Análise detalhada mensal</p>
                    </div>
                    <Switch
                      checked={notificationSettings.monthlyReport}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, monthlyReport: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Atualizações do sistema</Label>
                      <p className="text-sm text-gray-500">Novos recursos e melhorias</p>
                    </div>
                    <Switch
                      checked={notificationSettings.systemUpdates}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, systemUpdates: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>E-mails de marketing</Label>
                      <p className="text-sm text-gray-500">Dicas, tutoriais e promoções</p>
                    </div>
                    <Switch
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, marketingEmails: checked })
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleNotificationUpdate} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Salvando..." : "Salvar preferências"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notificações Push</CardTitle>
                <CardDescription>Configure notificações no navegador</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notificações push</Label>
                    <p className="text-sm text-gray-500">Receber notificações no navegador</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Mantenha sua conta segura com uma senha forte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha atual</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={handlePasswordChange} disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Alterando..." : "Alterar senha"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Autenticação de Dois Fatores</CardTitle>
                <CardDescription>Adicione uma camada extra de segurança à sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Autenticação de dois fatores (2FA)</Label>
                    <p className="text-sm text-gray-500">
                      {securitySettings.twoFactorAuth
                        ? "Sua conta está protegida com 2FA"
                        : "Adicione 2FA para maior segurança"}
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })}
                  />
                </div>

                {securitySettings.twoFactorAuth && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      2FA está ativo. Use seu aplicativo autenticador para fazer login.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Sessão</CardTitle>
                <CardDescription>Gerencie como suas sessões são mantidas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Alertas de login</Label>
                      <p className="text-sm text-gray-500">Receber e-mail quando alguém fizer login na sua conta</p>
                    </div>
                    <Switch
                      checked={securitySettings.loginAlerts}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, loginAlerts: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Timeout da sessão</Label>
                    <Select
                      value={securitySettings.sessionTimeout}
                      onValueChange={(value) => setSecuritySettings({ ...securitySettings, sessionTimeout: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">1 hora</SelectItem>
                        <SelectItem value="8h">8 horas</SelectItem>
                        <SelectItem value="24h">24 horas</SelectItem>
                        <SelectItem value="7d">7 dias</SelectItem>
                        <SelectItem value="30d">30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Plano Atual</CardTitle>
                <CardDescription>Gerencie sua assinatura e faturamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Crown className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {planLoading
                          ? "Carregando..."
                          : userPlan?.plan.type === "free"
                          ? "Plano Gratuito"
                          : userPlan?.plan.type === "pro"
                          ? "Plano Pro"
                          : "Plano Enterprise"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {planLoading
                          ? "Carregando limites..."
                          : `Até ${userPlan?.plan.limits.posts || 0} posts por mês`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {planLoading
                      ? "Carregando..."
                      : userPlan?.plan.status === "active"
                      ? "Ativo"
                      : userPlan?.plan.status}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Uso atual</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Posts este mês</span>
                      <span>
                        {planLoading
                          ? "Carregando..."
                          : `${userPlan?.usage.posts_published || 0}/${userPlan?.plan.limits.posts || 0}`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: planLoading
                            ? "0%"
                            : `${Math.min(
                                100,
                                ((userPlan?.usage.posts_published || 0) / (userPlan?.plan.limits.posts || 1)) * 100
                              )}%`,
                        }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm mt-4">
                      <span>Gerações com IA</span>
                      <span>
                        {planLoading
                          ? "Carregando..."
                          : `${userPlan?.usage.ai_generations || 0}/${userPlan?.plan.limits.ai_generations || 0}`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: planLoading
                            ? "0%"
                            : `${Math.min(
                                100,
                                ((userPlan?.usage.ai_generations || 0) / (userPlan?.plan.limits.ai_generations || 1)) * 100
                              )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  <Crown className="w-4 h-4 mr-2" />
                  Fazer Upgrade para Pro
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Planos Disponíveis</CardTitle>
                <CardDescription>Escolha o plano ideal para suas necessidades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Pro</h4>
                      <Badge>Mais Popular</Badge>
                    </div>
                    <p className="text-2xl font-bold">
                      R$ 29<span className="text-sm font-normal">/mês</span>
                    </p>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• 100 posts por mês</li>
                      <li>• Todas as redes sociais</li>
                      <li>• Relatórios avançados</li>
                      <li>• Suporte prioritário</li>
                    </ul>
                    <Button variant="outline" className="w-full">
                      Escolher Pro
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Enterprise</h4>
                      <Badge variant="secondary">Empresas</Badge>
                    </div>
                    <p className="text-2xl font-bold">
                      R$ 99<span className="text-sm font-normal">/mês</span>
                    </p>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Posts ilimitados</li>
                      <li>• Múltiplas contas</li>
                      <li>• API personalizada</li>
                      <li>• Suporte dedicado</li>
                    </ul>
                    <Button variant="outline" className="w-full">
                      Escolher Enterprise
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exportar Dados</CardTitle>
                <CardDescription>Baixe uma cópia dos seus dados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Você pode solicitar uma cópia de todos os seus dados, incluindo posts, configurações e relatórios.
                </p>
                <Button variant="outline">
                  <Save className="w-4 h-4 mr-2" />
                  Solicitar Exportação
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integração via API</CardTitle>
                <CardDescription>Configure integrações personalizadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Conecte o AutoPostIA com outras ferramentas usando nossa API.</p>
                <div className="flex gap-2">
                  <Button variant="outline">Ver Documentação</Button>
                  <Button variant="outline">Gerar Token</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                <CardDescription>Ações irreversíveis da conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atenção:</strong> Excluir sua conta removerá permanentemente todos os seus dados, incluindo
                    posts, configurações e relatórios. Esta ação não pode ser desfeita.
                  </AlertDescription>
                </Alert>

                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Conta Permanentemente
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Key, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function ChangePasswordPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
    if (success) setSuccess(false)
  }

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError("Senha atual é obrigatória")
      return false
    }

    if (!formData.newPassword) {
      setError("Nova senha é obrigatória")
      return false
    }

    if (formData.newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres")
      return false
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      return false
    }

    if (formData.currentPassword === formData.newPassword) {
      setError("A nova senha deve ser diferente da senha atual")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError("")

    try {
      // Simular chamada de API
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Em produção, aqui seria feita a chamada real para a API
      // await apiClient.changePassword(formData)

      setSuccess(true)
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua senha foi atualizada com segurança.",
      })

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push("/dashboard/settings")
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao alterar senha"
      setError(errorMessage)
      toast({
        title: "Erro ao alterar senha",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" }
    if (password.length < 6) return { strength: 25, label: "Fraca", color: "bg-red-500" }
    if (password.length < 8) return { strength: 50, label: "Regular", color: "bg-yellow-500" }
    if (password.length < 12) return { strength: 75, label: "Boa", color: "bg-blue-500" }
    return { strength: 100, label: "Forte", color: "bg-green-500" }
  }

  const passwordStrength = getPasswordStrength(formData.newPassword)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Key className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Alterar Senha</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Alterar Senha</CardTitle>
            <CardDescription>{user?.name}, mantenha sua conta segura com uma senha forte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Senha alterada com sucesso! Redirecionando...
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Digite sua senha atual"
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                    className="pr-10"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={isLoading}
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
                    placeholder="Digite sua nova senha"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                    className="pr-10"
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Força da senha:</span>
                      <span
                        className={`font-medium ${
                          passwordStrength.strength < 50
                            ? "text-red-600"
                            : passwordStrength.strength < 75
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pr-10"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Requisitos da senha:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li className={`flex items-center gap-2 ${formData.newPassword.length >= 8 ? "text-green-600" : ""}`}>
                    <div
                      className={`w-1 h-1 rounded-full ${formData.newPassword.length >= 8 ? "bg-green-600" : "bg-blue-400"}`}
                    ></div>
                    Pelo menos 8 caracteres
                  </li>
                  <li
                    className={`flex items-center gap-2 ${/[A-Z]/.test(formData.newPassword) ? "text-green-600" : ""}`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full ${/[A-Z]/.test(formData.newPassword) ? "bg-green-600" : "bg-blue-400"}`}
                    ></div>
                    Uma letra maiúscula
                  </li>
                  <li
                    className={`flex items-center gap-2 ${/[0-9]/.test(formData.newPassword) ? "text-green-600" : ""}`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full ${/[0-9]/.test(formData.newPassword) ? "bg-green-600" : "bg-blue-400"}`}
                    ></div>
                    Um número
                  </li>
                  <li
                    className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(formData.newPassword) ? "text-green-600" : ""}`}
                  >
                    <div
                      className={`w-1 h-1 rounded-full ${/[^A-Za-z0-9]/.test(formData.newPassword) ? "bg-green-600" : "bg-blue-400"}`}
                    ></div>
                    Um caractere especial
                  </li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || success}>
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Alterando senha...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Senha alterada!
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link href="/dashboard/settings" className="text-sm text-blue-600 hover:underline">
                Cancelar e voltar às configurações
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

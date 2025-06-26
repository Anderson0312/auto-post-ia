"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Key, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })

  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    // Verificar se o token é válido
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false)
        setError("Token de recuperação não encontrado")
        return
      }

      try {
        // Simular verificação do token
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Em produção, aqui seria feita a verificação real do token
        // const isValid = await apiClient.verifyResetToken(token)

        setTokenValid(true)
      } catch (err) {
        setTokenValid(false)
        setError("Token inválido ou expirado")
      }
    }

    verifyToken()
  }, [token])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const validateForm = () => {
    if (!formData.password) {
      setError("Nova senha é obrigatória")
      return false
    }

    if (formData.password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
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
      // Simular redefinição de senha
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Em produção, aqui seria feita a chamada real para a API
      // await apiClient.resetPassword(token, formData.password)

      setIsSuccess(true)
      toast({
        title: "Senha redefinida com sucesso!",
        description: "Você já pode fazer login com sua nova senha.",
      })

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao redefinir senha"
      setError(errorMessage)
      toast({
        title: "Erro na redefinição",
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

  const passwordStrength = getPasswordStrength(formData.password)

  // Token inválido ou não encontrado
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">AutoPostIA</span>
            </div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Link Inválido</CardTitle>
            <CardDescription>Este link de recuperação é inválido ou já expirou</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">O que fazer:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Solicite um novo link de recuperação</li>
                <li>• Verifique se copiou o link completo</li>
                <li>• Links expiram em 1 hora por segurança</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link href="/forgot-password">
                <Button className="w-full">Solicitar Novo Link</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Carregando verificação do token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando link de recuperação...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sucesso na redefinição
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">AutoPostIA</span>
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Senha Redefinida!</CardTitle>
            <CardDescription>Sua senha foi alterada com sucesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Sua senha foi redefinida com sucesso. Você será redirecionado para o login em alguns segundos.
              </AlertDescription>
            </Alert>

            <Link href="/login">
              <Button className="w-full">Fazer Login Agora</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Formulário de redefinição
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bot className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AutoPostIA</span>
          </div>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>Digite sua nova senha para acessar sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
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
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Redefinindo...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Redefinir Senha
                </>
              )}
            </Button>
          </form>

          {/* Password Requirements */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Requisitos da senha:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? "text-green-600" : ""}`}>
                <div
                  className={`w-1 h-1 rounded-full ${formData.password.length >= 8 ? "bg-green-600" : "bg-blue-400"}`}
                ></div>
                Pelo menos 8 caracteres
              </li>
              <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? "text-green-600" : ""}`}>
                <div
                  className={`w-1 h-1 rounded-full ${/[A-Z]/.test(formData.password) ? "bg-green-600" : "bg-blue-400"}`}
                ></div>
                Uma letra maiúscula
              </li>
              <li className={`flex items-center gap-2 ${/[0-9]/.test(formData.password) ? "text-green-600" : ""}`}>
                <div
                  className={`w-1 h-1 rounded-full ${/[0-9]/.test(formData.password) ? "bg-green-600" : "bg-blue-400"}`}
                ></div>
                Um número
              </li>
              <li
                className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(formData.password) ? "text-green-600" : ""}`}
              >
                <div
                  className={`w-1 h-1 rounded-full ${/[^A-Za-z0-9]/.test(formData.password) ? "bg-green-600" : "bg-blue-400"}`}
                ></div>
                Um caractere especial
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

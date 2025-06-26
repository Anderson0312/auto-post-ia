"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Mail, ArrowLeft, CheckCircle, AlertCircle, Send } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!email) {
      setError("E-mail é obrigatório")
      setIsLoading(false)
      return
    }

    if (!email.includes("@")) {
      setError("Digite um e-mail válido")
      setIsLoading(false)
      return
    }

    try {
      // Simular chamada de API para envio de e-mail
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Em produção, aqui seria feita a chamada real para a API
      // await apiClient.forgotPassword(email)

      setIsSuccess(true)
      toast({
        title: "E-mail enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao enviar e-mail de recuperação"
      setError(errorMessage)
      toast({
        title: "Erro no envio",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "E-mail reenviado!",
        description: "Verifique sua caixa de entrada novamente.",
      })
    } catch (err) {
      toast({
        title: "Erro ao reenviar",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
            <CardTitle className="text-2xl text-green-600">E-mail Enviado!</CardTitle>
            <CardDescription>Instruções de recuperação foram enviadas para seu e-mail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Enviado para:</strong> {email}
                <br />
                Verifique sua caixa de entrada e pasta de spam.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Próximos passos:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Verifique seu e-mail</li>
                  <li>Clique no link de recuperação</li>
                  <li>Defina uma nova senha</li>
                  <li>Faça login com a nova senha</li>
                </ol>
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">Não recebeu o e-mail?</p>
                <Button variant="outline" onClick={handleResendEmail} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Reenviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Reenviar E-mail
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="text-center">
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Voltar para o Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bot className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AutoPostIA</span>
          </div>
          <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
          <CardDescription>
            Não se preocupe! Digite seu e-mail e enviaremos instruções para redefinir sua senha.
          </CardDescription>
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
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail cadastrado"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError("")
                  }}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Link de Recuperação
                </>
              )}
            </Button>
          </form>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Enviaremos um link seguro para seu e-mail</li>
              <li>• O link expira em 1 hora por segurança</li>
              <li>• Você poderá definir uma nova senha</li>
              <li>• Após redefinir, faça login normalmente</li>
            </ul>
          </div>

          <div className="text-center space-y-2">
            <Link href="/login" className="inline-flex items-center text-blue-600 hover:underline font-medium">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar para o Login
            </Link>
            <p className="text-sm text-gray-500">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Cadastre-se gratuitamente
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

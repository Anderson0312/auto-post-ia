"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import {
  AVATAR_PARAM_FIELDS,
  DEFAULT_AVATAR_PARAMS,
  buildAvatarPromptConfig,
  type AvatarEditableParams,
} from "@/lib/avatars/selfie-prompt-template"
import { toast } from "sonner"

const FIELD_SECTIONS: Array<{ title: string; description: string; keys: Array<keyof AvatarEditableParams> }> = [
  {
    title: "Identidade básica",
    description: "Características principais do personagem.",
    keys: ["idade", "genero", "etnia", "tom_de_pele", "cor_dos_olhos"],
  },
  {
    title: "Cabelo",
    description: "Cor, comprimento e textura.",
    keys: ["cor_do_cabelo", "comprimento_do_cabelo", "tipo_de_cabelo"],
  },
  {
    title: "Corpo e rosto",
    description: "Formato corporal e traços faciais.",
    keys: ["tipo_de_corpo", "formato_do_corpo", "tracos_faciais"],
  },
  {
    title: "Estilo",
    description: "Roupa, maquiagem e acessórios.",
    keys: ["maquiagem", "roupa", "acessorios"],
  },
  {
    title: "Cenário e expressão",
    description: "Ambiente da selfie e emoção.",
    keys: ["local", "iluminacao", "expressao"],
  },
]

export default function NewAvatarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Carregando...</div>}>
      <NewAvatarPageContent />
    </Suspense>
  )
}

function NewAvatarPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isImport = searchParams.get("mode") === "import"

  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [name, setName] = useState("")
  const [niche, setNiche] = useState("")
  const [personality, setPersonality] = useState("")
  const [importDescription, setImportDescription] = useState("")
  const [avatarParams, setAvatarParams] = useState<AvatarEditableParams>({ ...DEFAULT_AVATAR_PARAMS })

  const promptPreview = useMemo(() => buildAvatarPromptConfig(avatarParams), [avatarParams])

  const updateParam = (key: keyof AvatarEditableParams, value: string) => {
    setAvatarParams((prev) => ({ ...prev, [key]: value }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { avatar } = await apiClient.createAvatar({
        name,
        niche: niche || undefined,
        personality: personality || undefined,
        avatarParams,
      })
      toast.success("Avatar em processamento")
      router.push(`/dashboard/avatars/${avatar.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar avatar")
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formEl = e.currentTarget
      const fileInput = formEl.elements.namedItem("images") as HTMLInputElement
      const files = fileInput?.files
      if (!files?.length) {
        toast.error("Selecione pelo menos uma imagem")
        return
      }

      const images = await Promise.all(
        Array.from(files).map(
          (file) =>
            new Promise<{ base64: string; mimeType: string; filename: string }>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result as string
                resolve({
                  base64: result.split(",")[1],
                  mimeType: file.type,
                  filename: file.name,
                })
              }
              reader.onerror = reject
              reader.readAsDataURL(file)
            }),
        ),
      )

      const { avatar } = await apiClient.importAvatar({
        name,
        description: importDescription,
        images,
      })

      toast.success("Avatar importado")
      router.push(`/dashboard/avatars/${avatar.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao importar avatar")
    } finally {
      setLoading(false)
    }
  }

  const renderField = (key: keyof AvatarEditableParams) => {
    const field = AVATAR_PARAM_FIELDS.find((item) => item.key === key)
    if (!field) return null

    const value = avatarParams[key]

    if (field.type === "select" && field.options) {
      return (
        <div key={key}>
          <Label htmlFor={key}>{field.label}</Label>
          <Select value={value} onValueChange={(next) => updateParam(key, next)}>
            <SelectTrigger id={key}>
              <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (field.type === "textarea") {
      return (
        <div key={key}>
          <Label htmlFor={key}>{field.label}</Label>
          <Textarea
            id={key}
            value={value}
            onChange={(e) => updateParam(key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        </div>
      )
    }

    return (
      <div key={key}>
        <Label htmlFor={key}>{field.label}</Label>
        <Input
          id={key}
          value={value}
          onChange={(e) => updateParam(key, e.target.value)}
          placeholder={field.placeholder}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold">{isImport ? "Importar Avatar" : "Criar Avatar"}</h1>
        {!isImport && (
          <p className="mt-1 text-sm text-muted-foreground">
            Defina a aparência do personagem para gerar uma selfie fotorrealista com smartphone.
          </p>
        )}
      </div>

      {isImport ? (
        <Card>
          <CardHeader>
            <CardTitle>Enviar fotos de referência</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="importDescription">Descrição</Label>
                <Textarea
                  id="importDescription"
                  value={importDescription}
                  onChange={(e) => setImportDescription(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="images">Fotos</Label>
                <Input id="images" name="images" type="file" accept="image/*" multiple required />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Importando..." : "Importar"}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/avatars">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleCreate} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do avatar</CardTitle>
              <CardDescription>Nome e contexto para roteiros e vídeos.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ana Creator" />
              </div>
              <div>
                <Label htmlFor="niche">Nicho (opcional)</Label>
                <Input id="niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Ex: fitness, finanças" />
              </div>
              <div>
                <Label htmlFor="personality">Personalidade (opcional)</Label>
                <Input
                  id="personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="Ex: carismática e direta"
                />
              </div>
            </CardContent>
          </Card>

          {FIELD_SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {section.keys.map((key) => (
                  <div key={key} className={key === "tracos_faciais" || key === "formato_do_corpo" ? "sm:col-span-2" : undefined}>
                    {renderField(key)}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Preview do prompt</CardTitle>
                <CardDescription>Estrutura enviada para geração da imagem.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview((prev) => !prev)}>
                {showPreview ? "Ocultar" : "Mostrar"}
              </Button>
            </CardHeader>
            {showPreview && (
              <CardContent>
                <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs leading-relaxed">
                  {JSON.stringify(promptPreview, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Avatar"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/avatars">Cancelar</Link>
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

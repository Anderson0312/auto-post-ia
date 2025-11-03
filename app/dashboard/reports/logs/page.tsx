"use client"
import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function LogsDePostsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [platformFilter, setPlatformFilter] = useState<string>("")
  const [search, setSearch] = useState<string>("")
  const [autoNotify, setAutoNotify] = useState<boolean>(true)
  const lastErrorIdsRef = useRef<Set<string>>(new Set())
  const [resending, setResending] = useState<boolean>(false)
  const [queueItems, setQueueItems] = useState<any[]>([])
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>("")
  const [queuePage, setQueuePage] = useState<number>(1)
  const [queueTotal, setQueueTotal] = useState<number>(0)
  const queueLimit = 10

  // Pagination state
  const [page, setPage] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)
  const limit = 10

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesStatus = statusFilter ? log.status === statusFilter : true
      const matchesPlatform = platformFilter ? (log.platform || "").toLowerCase() === platformFilter : true
      const matchesSearch = search
        ? [log.message, log.error_code, log.external_post_id, log.platform]
            .filter(Boolean)
            .some((v: string) => v.toLowerCase().includes(search.toLowerCase()))
        : true
      return matchesStatus && matchesPlatform && matchesSearch
    })
  }, [logs, statusFilter, platformFilter, search])

  async function fetchLogs() {
    const params = new URLSearchParams()
    params.set("limit", String(limit))
    params.set("page", String(page))
    if (statusFilter) params.set("status", statusFilter)
    if (platformFilter) params.set("platform", platformFilter)

    const res = await fetch(`/api/posts/logs?${params.toString()}`)
    if (!res.ok) return
    const data = await res.json()

    // Expecting { items, total, page, limit }
    setLogs(data?.items || [])
    setTotal(data?.total || 0)

    // Notificações em tempo real de erros
    if (autoNotify) {
      for (const log of data?.items || []) {
        if (log.status === "error" && !lastErrorIdsRef.current.has(log.id)) {
          lastErrorIdsRef.current.add(log.id)
          toast({
            title: "Falha ao publicar",
            description: `${log.platform?.toUpperCase() || "Plataforma"}: ${log.message || "Erro desconhecido"}`,
          })
        }
      }
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, platformFilter, page])

  async function fetchQueue() {
    const params = new URLSearchParams()
    params.set("limit", String(queueLimit))
    params.set("page", String(queuePage))
    if (queueStatusFilter) params.set("status", queueStatusFilter)

    const res = await fetch(`/api/posts/queue?${params.toString()}`)
    if (!res.ok) return
    const data = await res.json()
    setQueueItems(data?.items || [])
    setQueueTotal(data?.total || 0)
  }

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueStatusFilter, queuePage])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(total, page * limit)

  return (
    <>
      {/* Header padrão com voltar */}
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
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h1 className="sm:inline text-xl font-bold text-gray-900">Relatórios · Logs de Posts</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" onClick={fetchLogs} className="p-2">Atualizar</Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select
            className="w-full border rounded px-2 py-2"
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}
          >
            <option value="">Todos</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="info">Info</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Plataforma</label>
          <select
            className="w-full border rounded px-2 py-2"
            value={platformFilter}
            onChange={(e) => { setPage(1); setPlatformFilter(e.target.value) }}
          >
            <option value="">Todas</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Busca</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Mensagem, código de erro, ID externo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">Mostrando {startItem}–{endItem} de {total}</div>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoNotify}
            onChange={(e) => setAutoNotify(e.target.checked)}
          />
          <span>Notificar erros em tempo real</span>
        </label>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Data</th>
              <th className="text-left p-2">Plataforma</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Mensagem</th>
              <th className="text-left p-2">Código</th>
              <th className="text-left p-2">Post Externo</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="p-2">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-2">{log.platform}</td>
                <td className="p-2">
                  {log.status === "success" && (
                    <Badge className="gap-1 bg-green-600 text-white border-transparent"><CheckCircle2 className="w-3 h-3"/> success</Badge>
                  )}
                  {log.status === "error" && (
                    <Badge className="gap-1 bg-red-600 text-white border-transparent"><AlertTriangle className="w-3 h-3"/> error</Badge>
                  )}
                  {log.status === "info" && (
                    <Badge variant="secondary" className="gap-1"><Info className="w-3 h-3"/> info</Badge>
                  )}
                </td>
                <td className="p-2">{log.message}</td>
                <td className="p-2">{log.error_code || "-"}</td>
                <td className="p-2">{log.external_post_id || "-"}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td className="p-3 text-center" colSpan={6}>Nenhum log encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >Anterior</Button>
        <div className="text-sm">Página {page} de {totalPages}</div>
        <Button
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >Próxima</Button>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Fila de Processamento</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-sm mb-1">Status na fila</label>
            <select
             className="w-full border rounded px-2 py-2"
             value={queueStatusFilter}
             onChange={(e) => { setQueuePage(1); setQueueStatusFilter(e.target.value) }}
           >
              <option value="">Todos</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={fetchQueue} className="p-2">Atualizar</Button>
          </div>
        </div>

        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Agendado para</th>
                <th className="text-left p-2">Plataforma</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Tentativas</th>
                <th className="text-left p-2">Processado em</th>
                <th className="text-left p-2">Mensagem de erro</th>
              </tr>
            </thead>
            <tbody>
              {queueItems.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{new Date(item.scheduled_for).toLocaleString()}</td>
                  <td className="p-2">{item.posts?.social_accounts?.platform || '-'}</td>
                  <td className="p-2">
                    {item.status === "completed" && (
                      <Badge className="gap-1 bg-green-600 text-white border-transparent"><CheckCircle2 className="w-3 h-3"/> completed</Badge>
                    )}
                    {item.status === "failed" && (
                      <Badge className="gap-1 bg-red-600 text-white border-transparent"><AlertTriangle className="w-3 h-3"/> failed</Badge>
                    )}
                    {item.status === "processing" && (
                      <Badge className="gap-1 bg-blue-600 text-white border-transparent animate-pulse">processing</Badge>
                    )}
                    {item.status === "pending" && (
                      <Badge variant="outline">pending</Badge>
                    )}
                    {item.status === "cancelled" && (
                      <Badge variant="destructive">cancelled</Badge>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">{item.attempts}/{item.max_attempts}</span>
                      <Progress
                        value={item.max_attempts ? Math.min(100, Math.round((item.attempts / item.max_attempts) * 100)) : 0}
                        className="h-2"
                      />
                    </div>
                  </td>
                  <td className="p-2">{item.processed_at ? new Date(item.processed_at).toLocaleString() : '-'}</td>
                  <td className="p-2">{item.error_message || '-'}</td>
                </tr>
              ))}
              {queueItems.length === 0 && (
                <tr>
                  <td className="p-3 text-center" colSpan={6}>Nenhum item na fila.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Queue pagination controls */}
        <div className="flex items-center justify-between mt-3">
          <Button
            variant="outline"
            disabled={queuePage <= 1}
            onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
          >Anterior</Button>
          <div className="text-sm">Página {queuePage} de {Math.max(1, Math.ceil(queueTotal / queueLimit))}</div>
          <Button
            variant="outline"
            disabled={queuePage >= Math.max(1, Math.ceil(queueTotal / queueLimit))}
            onClick={() => setQueuePage((p) => p + 1)}
          >Próxima</Button>
        </div>
      </div>
      </main>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Success</div>
            <div className="text-2xl font-semibold">{logs.filter(l => l.status === 'success').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Error</div>
            <div className="text-2xl font-semibold">{logs.filter(l => l.status === 'error').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Info</div>
            <div className="text-2xl font-semibold">{logs.filter(l => l.status === 'info').length}</div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
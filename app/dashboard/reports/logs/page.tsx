"use client"
import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
    params.set("limit", "100")
    if (statusFilter) params.set("status", statusFilter)
    if (platformFilter) params.set("platform", platformFilter)

    const res = await fetch(`/api/posts/logs?${params.toString()}`)
    if (!res.ok) return
    const data = await res.json()
    setLogs(data || [])

    // Notificações em tempo real de erros
    if (autoNotify) {
      for (const log of data || []) {
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
  }, [statusFilter, platformFilter])

  async function fetchQueue() {
    const params = new URLSearchParams()
    params.set("limit", "100")
    if (queueStatusFilter) params.set("status", queueStatusFilter)

    const res = await fetch(`/api/posts/queue?${params.toString()}`)
    if (!res.ok) return
    const data = await res.json()
    setQueueItems(data || [])
  }

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueStatusFilter])

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
            onChange={(e) => setStatusFilter(e.target.value)}
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
            onChange={(e) => setPlatformFilter(e.target.value)}
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
        <div />
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoNotify}
            onChange={(e) => setAutoNotify(e.target.checked)}
          />
          <span>Notificar erros em tempo real</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className="border rounded px-3 py-2 hover:bg-gray-50"
          disabled={resending}
          onClick={async () => {
            setResending(true)
            try {
              const res = await fetch('/api/posts/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'error', limit: 50 }),
              })
              const data = await res.json()
              toast({ title: 'Reenvio disparado', description: `Erros reenviados: ${data?.count ?? 0}` })
              await fetchLogs()
            } catch (e: any) {
              toast({ title: 'Falha ao reenviar', description: e?.message || 'Erro desconhecido' })
            } finally {
              setResending(false)
            }
          }}
        >
          Reenviar todos com erro
        </button>
        <button
          className="border rounded px-3 py-2 hover:bg-gray-50"
          disabled={resending}
          onClick={async () => {
            setResending(true)
            try {
              const res = await fetch('/api/posts/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'failed', limit: 50 }),
              })
              const data = await res.json()
              toast({ title: 'Reenvio disparado', description: `Falhas reenviadas: ${data?.count ?? 0}` })
              await fetchLogs()
            } catch (e: any) {
              toast({ title: 'Falha ao reenviar', description: e?.message || 'Erro desconhecido' })
            } finally {
              setResending(false)
            }
          }}
        >
          Reenviar todos com falha
        </button>
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
                <td className="p-2">{log.status}</td>
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

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Fila de Processamento</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-sm mb-1">Status na fila</label>
            <select
              className="w-full border rounded px-2 py-2"
              value={queueStatusFilter}
              onChange={(e) => setQueueStatusFilter(e.target.value)}
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
                  <td className="p-2">{item.status}</td>
                  <td className="p-2">{item.attempts}/{item.max_attempts}</td>
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
      </div>
      </main>
    </>
  )
}
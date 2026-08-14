"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { apiClient } from "@/lib/api-client"

export function useAPI<T>(apiCall: () => Promise<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const apiRef = useRef(apiCall)
  apiRef.current = apiCall

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const result = await apiRef.current()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(false)
    // dependências explícitas do caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  const refetch = useCallback(() => fetchData(true), [fetchData])

  return { data, loading, error, refetch }
}

export function useMutation<T, P>(apiCall: (params: P) => Promise<T>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = async (params: P): Promise<T | null> => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall(params)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}

export function useSocialAccounts() {
  return useAPI(() => apiClient.getSocialAccounts())
}

export function useAIThemes() {
  return useAPI(() => apiClient.getAIThemes())
}

export function useAIConfig() {
  return useAPI(() => apiClient.getAIConfig())
}

export function usePosts() {
  return useAPI(() => apiClient.getPosts())
}

export function useAnalytics(period = "30days") {
  return useAPI(() => apiClient.getAnalytics(period), [period])
}

export function useUsage() {
  return useAPI(() => apiClient.getUsage())
}

export function useUserPlan() {
  return useAPI(() => apiClient.getUserPlan())
}

export function useAvatars() {
  return useAPI(() => apiClient.getAvatars())
}

export function useAvatar(id: string) {
  return useAPI(() => apiClient.getAvatar(id), [id])
}

export function useProjects() {
  return useAPI(() => apiClient.getProjects())
}

export function useProject(id: string) {
  return useAPI(() => apiClient.getProject(id), [id])
}

export function useProjectJobs(id: string) {
  return useAPI(() => apiClient.getProjectJobs(id), [id])
}

const PROJECT_BUSY_STATUSES = ["scripting", "storyboard", "generating_scenes", "rendering"]

export function useProjectAutoRefresh(
  id: string,
  projectStatus?: string,
  refetchProject?: () => void,
  intervalMs = 4000,
) {
  const { data, loading, error, refetch } = useProjectJobs(id)
  const jobs = (data as { jobs?: Array<{ status?: string }> } | null)?.jobs || []
  const hasActiveJobs = jobs.some((job) => job.status === "pending" || job.status === "processing")
  const projectBusy = projectStatus ? PROJECT_BUSY_STATUSES.includes(projectStatus) : false

  useEffect(() => {
    if (!id) return
    if (!hasActiveJobs && !projectBusy) return

    const timer = setInterval(() => {
      refetch()
      refetchProject?.()
    }, intervalMs)

    return () => clearInterval(timer)
  }, [hasActiveJobs, id, intervalMs, projectBusy, refetch, refetchProject])

  return { data, loading, error, refetch }
}

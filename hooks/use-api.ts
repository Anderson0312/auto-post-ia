"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

export function useAPI<T>(apiCall: () => Promise<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, dependencies)

  const refetch = () => {
    fetchData()
  }

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

// Specific hooks for common operations
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

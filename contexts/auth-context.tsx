"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"

interface User {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  timezone: string
  language: string
  post_format: string
  plan_type: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    name: string
    email: string
    password: string
    acceptTerms: boolean
  }) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = apiClient.getToken()
      if (!token) {
        setLoading(false)
        return
      }

      const response = await apiClient.getProfile()
      setUser(response.user)
    } catch (error) {
      console.error("Auth check failed:", error)
      apiClient.clearToken()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password })
      apiClient.setToken(response.token)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const register = async (data: {
    name: string
    email: string
    password: string
    acceptTerms: boolean
  }) => {
    try {
      const response = await apiClient.register(data)
      apiClient.setToken(response.token)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    apiClient.clearToken()
    setUser(null)
  }

  const updateUser = async (data: Partial<User>) => {
    try {
      const response = await apiClient.updateProfile(data)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const response = await apiClient.getProfile()
      setUser(response.user)
    } catch (error) {
      console.error("Failed to refresh user:", error)
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

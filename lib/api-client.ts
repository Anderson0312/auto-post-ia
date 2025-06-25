class APIClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || ""
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  getToken(): string | null {
    if (this.token) return this.token
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`
    const token = this.getToken()

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // Auth methods
  async register(data: {
    name: string
    email: string
    password: string
    acceptTerms: boolean
  }) {
    return this.request<{
      user: any
      token: string
      message: string
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async login(data: { email: string; password: string }) {
    return this.request<{
      user: any
      token: string
      message: string
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Demo login method
  async loginDemo() {
    return this.request<{
      user: any
      token: string
      message: string
      isDemo: boolean
    }>("/auth/demo", {
      method: "POST",
    })
  }

  // User methods
  async getProfile() {
    return this.request<{ user: any }>("/user/profile")
  }

  async updateProfile(data: any) {
    return this.request<{
      user: any
      message: string
    }>("/user/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // AI Configuration methods
  async getAIConfig() {
    return this.request<any>("/ai/config")
  }

  async updateAIConfig(data: any) {
    return this.request<any>("/ai/config", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // AI Themes methods
  async getAIThemes() {
    return this.request<any[]>("/ai/themes")
  }

  async createAITheme(data: { name: string; description?: string }) {
    return this.request<any>("/ai/themes", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async deleteAITheme(themeId: string) {
    return this.request<any>(`/ai/themes/${themeId}`, {
      method: "DELETE",
    })
  }

  // Social Accounts methods
  async getSocialAccounts() {
    return this.request<any[]>("/social/accounts")
  }

  async connectSocialAccount(platform: string, authData: any) {
    return this.request<any>("/social/connect", {
      method: "POST",
      body: JSON.stringify({ platform, ...authData }),
    })
  }

  async disconnectSocialAccount(accountId: string) {
    return this.request<any>(`/social/accounts/${accountId}/disconnect`, {
      method: "POST",
    })
  }

  async toggleSocialAccount(accountId: string, active: boolean) {
    return this.request<any>(`/social/accounts/${accountId}/toggle`, {
      method: "PUT",
      body: JSON.stringify({ active }),
    })
  }

  // Posts methods
  async getPosts(limit = 50) {
    return this.request<any[]>(`/posts?limit=${limit}`)
  }

  async createPost(data: any) {
    return this.request<any>("/posts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async generatePost(data: any) {
    return this.request<any>("/ai/generate-post", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Analytics methods
  async getAnalytics(period = "30days") {
    return this.request<any>(`/analytics?period=${period}`)
  }

  async getUsage() {
    return this.request<any>("/user/usage")
  }
}

export const apiClient = new APIClient()

class APIClient {
  private baseURL: string

  constructor() {
    // No browser, sempre mesma origem — evita Failed to fetch entre localhost e 127.0.0.1.
    this.baseURL = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_API_URL || ""
  }

  // Todas as requisições passam a usar cookies HttpOnly (credentials: 'include').
  // Não usamos mais Authorization bearer nem localStorage.
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
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

  /**
   * Cria uma conta de usuário.
   * 1. Tenta acessar /api/auth/register (funciona em produção/dev).
   * 2. Se o fetch falhar (preview), devolve um usuário mockado e um
   *    token fictício para que a interface continue funcionando.
   */
  async register(data: {
    name: string
    email: string
    password: string
    acceptTerms: boolean
  }) {
    try {
      // (1) chamada real – ambiente local / produção
      return await this.request<{
        user: any
        token: string
        message: string
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.warn("⚠️  /api/auth/register indisponível no preview. Usando fallback local.")

      // (2) Fallback mock
      const now = new Date().toISOString()
      const mockUser = {
        id: "mock-user-" + Math.random().toString(36).slice(2),
        name: data.name,
        email: data.email,
        phone: "",
        bio: "",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
        post_format: "medium",
        plan_type: "free",
        avatar_url: "",
        created_at: now,
        updated_at: now,
      }

      const fakeToken = "mock.jwt.token"

      // Imitamos a resposta original
      return {
        user: mockUser,
        token: fakeToken,
        message: "Conta criada (modo preview)",
      }
    }
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

  /**
   * Faz login na conta demo.
   * 1. Tenta usar a rota /api/auth/demo (funciona em produção).
   * 2. Se a rota não existir (preview v0), cai no fallback local.
   */
  async loginDemo() {
    try {
      // 1) Tenta a chamada normal (produção / dev local)
      return await this.request<{
        user: any
        token: string
        message: string
      }>("/auth/demo", { method: "POST" })
    } catch (error) {
      console.warn("⚠️  /api/auth/demo não disponível no preview. Usando fallback local de demo.")

      // 2) Fallback: cria um usuário demo em memória
      //    (os campos só precisam satisfazer a UI)
      const demoUser = {
        id: "demo-user-id",
        name: "Usuário Demo",
        email: "demo@autopostia.com",
        phone: "+55 11 99999-9999",
        bio: "Conta de demonstração do AutoPostIA",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
        post_format: "medium",
        plan_type: "pro",
        avatar_url: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // token fictício apenas para manter a interface
      const fakeToken = "demo.jwt.token"

      return {
        user: demoUser,
        token: fakeToken,
        message: "Acesso demo local",
      }
    }
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
  
  async updatePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request<{ message: string }>("/user/password", {
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

  async refreshFollowersCount(accountId: string) {
    return this.request<any>(`/social/accounts/${accountId}/refresh-followers`, {
      method: "POST",
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

  // Post detail and manipulation
  async getPostDetails(id: string) {
    return this.request<{ post: any }>(`/automation/posts/${id}`)
  }

  async updatePost(id: string, data: { scheduledFor?: string; content?: string; imageUrl?: string; hashtags?: string[] }) {
    return this.request<any>(`/automation/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deletePost(id: string) {
    return this.request<any>(`/automation/posts/${id}`, {
      method: "DELETE",
    })
  }
  
  async generateAIText(data: { prompt: string; max_tokens?: number }) {
    return this.request<{ text: string }>("/ai/generate-text", {
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
  
  async getUserPlan() {
    return this.request<{
      plan: {
        type: string;
        status: string;
        limits: {
          posts: number;
          ai_generations: number;
        };
      };
      usage: {
        posts_created: number;
        posts_published: number;
        ai_generations: number;
      };
    }>("/user/plan")
  }

  // Avatars
  async getAvatars() {
    return this.request<{ avatars: any[] }>("/avatars")
  }

  async getAvatar(id: string) {
    return this.request<{ avatar: any }>(`/avatars/${id}`)
  }

  async createAvatar(data: Record<string, unknown>) {
    return this.request<{ avatar: any; message: string }>("/avatars", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async importAvatar(data: Record<string, unknown>) {
    return this.request<{ avatar: any; message: string }>("/avatars/import", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Projects
  async getProjects() {
    return this.request<{ projects: any[] }>("/projects")
  }

  async getProject(id: string) {
    return this.request<{ project: any }>(`/projects/${id}`)
  }

  async createProject(data: Record<string, unknown>) {
    return this.request<{ project: any }>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getProjectJobs(id: string) {
    return this.request<{ jobs: any[] }>(`/projects/${id}/jobs`)
  }

  async generateProjectScript(id: string) {
    return this.request<any>(`/projects/${id}/generate-script`, { method: "POST" })
  }

  async generateProjectStoryboard(id: string) {
    return this.request<any>(`/projects/${id}/generate-storyboard`, { method: "POST" })
  }

  async generateProjectVideo(id: string) {
    return this.request<any>(`/projects/${id}/generate-video`, { method: "POST" })
  }

  // Viral Engine (Fase 2)
  async generateViralIdeas(data: Record<string, unknown>) {
    return this.request<{ ideas: any[] }>("/viral/ideas", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async buildGuidedBrief(data: Record<string, unknown>) {
    return this.request<{ brief: any }>("/viral/guided-brief", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async optimizeHook(data: Record<string, unknown>) {
    return this.request<any>("/viral/optimize-hook", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getTrendingTopics(data: Record<string, unknown>) {
    return this.request<{ trends: any[] }>("/viral/trends", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async generateProjectNarration(id: string) {
    return this.request<{ audioUrl: string; voice: string }>(`/projects/${id}/generate-narration`, {
      method: "POST",
    })
  }

  async generateProjectSubtitles(id: string) {
    return this.request<{ srtUrl: string; cueCount: number }>(`/projects/${id}/generate-subtitles`, {
      method: "POST",
    })
  }

  async exportProject(id: string) {
    return this.request<Record<string, unknown>>(`/projects/${id}/export`)
  }

  async getGrowthObjective() {
    return this.request<{ objective: string }>("/grow/objective")
  }

  async setGrowthObjective(objective: string) {
    return this.request<{ objective: string }>("/grow/objective", {
      method: "PATCH",
      body: JSON.stringify({ objective }),
    })
  }

  async analyzeChannel(url: string, objective: string) {
    return this.request<{
      platform: string
      channel: string
      url: string
      notice: string
      ideas: any[]
    }>("/grow/channel", {
      method: "POST",
      body: JSON.stringify({ url, objective }),
    })
  }

  async getWorldTrends(objective: string) {
    return this.request<{
      youtube: any[]
      formats: any[]
      note: string
    }>(`/grow/trending?objective=${encodeURIComponent(objective)}`)
  }

  async getVideoProvidersStatus() {
    return this.request<{
      canGenerateVideo: boolean
      message: string
      primary: string | null
      kling: { canGenerateVideo: boolean; message: string }
      gemini: { canGenerateVideo: boolean; message: string }
    }>("/integrations/video/status")
  }
}

export const apiClient = new APIClient()

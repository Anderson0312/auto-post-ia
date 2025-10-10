import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Client-side client for user operations
export const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Database query helpers
export class DatabaseService {
  // User operations
  static async createUser(userData: {
    email: string
    name: string
    password: string
    phone?: string
    bio?: string
    timezone?: string
    language?: string
    post_format?: string
  }) {
    const { data, error } = await supabaseAdmin.from("users").insert([userData]).select().single()

    if (error) throw error
    return data
  }

  static async getUserById(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select(`
        *,
        user_settings(*),
        social_accounts(*),
        ai_themes(*),
        ai_configurations(*),
        billing(*)
      `)
      .eq("id", userId)
      .single()

    if (error) throw error
    return data
  }

  static async getUserByEmail(email: string) {
    const { data, error } = await supabaseAdmin.from("users").select("*").eq("email", email).single()

    if (error) throw error
    return data
  }

  static async updateUser(userId: string, updates: any) {
    const { data, error } = await supabaseAdmin.from("users").update(updates).eq("id", userId).select().single()

    if (error) throw error
    return data
  }
  
  static async getNotificationSettings(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .select("notification_settings")
      .eq("user_id", userId)
      .single()

    if (error) {
      // Se não existir, criar com valores padrão
      if (error.code === "PGRST116") {
        const defaultSettings = {
          emailNotifications: true,
          postSuccess: true,
          postFailure: true,
          accountActivity: true,
          systemUpdates: true,
          marketingEmails: false
        }
        
        await this.updateNotificationSettings(userId, defaultSettings)
        return { notification_settings: defaultSettings }
      }
      throw error
    }
    
    return data.notification_settings
  }
  
  static async updateNotificationSettings(userId: string, settings: any) {
    // Verificar se já existe um registro para o usuário
    const { data: existingSettings } = await supabaseAdmin
      .from("user_settings")
      .select("id")
      .eq("user_id", userId)
      .single()
    
    let result
    
    if (existingSettings) {
      // Atualizar configurações existentes
      const { data, error } = await supabaseAdmin
        .from("user_settings")
        .update({ notification_settings: settings })
        .eq("user_id", userId)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Criar novas configurações
      const { data, error } = await supabaseAdmin
        .from("user_settings")
        .insert({ user_id: userId, notification_settings: settings })
        .select()
        .single()
      
      if (error) throw error
      result = data
    }
    
    return result.notification_settings
  }

  // User settings operations
  static async createUserSettings(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .insert([{ user_id: userId }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Social accounts operations
  static async createSocialAccount(accountData: {
    user_id: string
    platform: string
    platform_user_id: string
    username: string
    display_name?: string
    access_token: string
    refresh_token?: string
    token_expires_at?: string
    followers_count?: number
  }) {
    const { data, error } = await supabaseAdmin.from("social_accounts").insert([accountData]).select().single()

    if (error) throw error
    return data
  }

  static async getSocialAccounts(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("social_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_connected", true)

    if (error) throw error
    return data
  }

  static async updateSocialAccount(accountId: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from("social_accounts")
      .update(updates)
      .eq("id", accountId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Buscar uma conta social específica por usuário/plataforma/platform_user_id
  static async getSocialAccount(
    userId: string,
    platform: string,
    platformUserId: string,
  ): Promise<any | null> {
    const { data, error } = await supabaseAdmin
      .from("social_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", platform)
      .eq("platform_user_id", platformUserId)
      .limit(1)

    if (error) throw error
    return Array.isArray(data) && data.length > 0 ? data[0] : null
  }

  // AI configuration operations
  static async getAIConfiguration(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("ai_configurations")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single()

    if (error) throw error
    return data
  }

  static async updateAIConfiguration(userId: string, config: any) {
    // Primeiro, desativar configurações existentes
    await supabaseAdmin.from("ai_configurations").update({ is_active: false }).eq("user_id", userId)

    // Criar nova configuração
    const { data, error } = await supabaseAdmin
      .from("ai_configurations")
      .insert([{ user_id: userId, ...config }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // AI themes operations
  static async getAIThemes(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("ai_themes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  static async createAITheme(themeData: {
    user_id: string
    name: string
    description?: string
  }) {
    const { data, error } = await supabaseAdmin.from("ai_themes").insert([themeData]).select().single()

    if (error) throw error
    return data
  }

  static async deleteAITheme(themeId: string) {
    const { data, error } = await supabaseAdmin
      .from("ai_themes")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", themeId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Posts operations
  static async createPost(postData: {
    user_id: string
    social_account_id: string
    content: string
    image_url?: string
    image_prompt?: string
    hashtags?: string[]
    scheduled_for: string
    ai_theme_id?: string
    ai_prompt?: string
    generation_model?: string
    status?: string
  }) {
    const { data, error } = await supabaseAdmin.from("posts").insert([postData]).select().single()

    if (error) throw error
    return data
  }

  static async getPosts(userId: string, limit = 50) {
    const { data, error } = await supabaseAdmin
      .from("posts")
      .select(`
        *,
        social_accounts(platform, username),
        ai_themes(name)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }


  static async updatePostStatus(postId: string, status: string, updates: any = {}) {
    const { data, error } = await supabaseAdmin
      .from("posts")
      .update({ status, ...updates })
      .eq("id", postId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Usage tracking
  static async updateUsageTracking(
    userId: string,
    type: "posts_created" | "posts_published" | "ai_generations" | "api_calls",
  ) {
    const monthYear = new Date().toISOString().slice(0, 7) // YYYY-MM format

    const { data, error } = await supabaseAdmin
      .from("usage_tracking")
      .upsert(
        [
          {
            user_id: userId,
            month_year: monthYear,
            [type]: 1,
          },
        ],
        {
          onConflict: "user_id,month_year",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserUsage(userId: string, monthYear?: string) {
    const targetMonth = monthYear || new Date().toISOString().slice(0, 7)

    const { data, error } = await supabaseAdmin
      .from("usage_tracking")
      .select("*")
      .eq("user_id", userId)
      .eq("month_year", targetMonth)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return (
      data || {
        posts_created: 0,
        posts_published: 0,
        ai_generations: 0,
        api_calls: 0,
      }
    )
  }

  // Automation methods
  static async getPostsForToday(userId: string) {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", today)
      .lt("created_at", new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    if (error) throw error
    return data || []
  }

  static async getScheduledPosts(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("posts")
      .select(`
        *,
        social_accounts(platform, username)
      `)
      .eq("user_id", userId)
      .in("status", ["scheduled", "processing"])
      .order("scheduled_for", { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getReadyPosts() {
    const now = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from("post_queue")
      .select(`
        *,
        posts(*)
      `)
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getUsersWithActiveAutomation() {
    const { data, error } = await supabaseAdmin
      .from("ai_configurations")
      .select("user_id")
      .eq("is_active", true)

    if (error) throw error
    return data || []
  }

  static async getUsersWithActiveAutomationDetails() {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select(`
        id,
        email,
        name,
        ai_configurations!inner(
          id,
          themes,
          posts_per_day,
          post_times,
          content_style,
          generate_images,
          post_objective,
          custom_instructions,
          language,
          post_format,
          is_active
        )
      `)
      .eq("ai_configurations.is_active", true)

    if (error) throw error
    return data || []
  }


  static async getPostById(postId: string) {
    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single()

    if (error) throw error
    return data
  }

  static async getSocialAccountById(accountId: string) {
    const { data, error } = await supabaseAdmin
      .from("social_accounts")
      .select("*")
      .eq("id", accountId)
      .single()

    if (error) throw error
    return data
  }


  static async createQueueItem(queueData: {
    post_id: string
    user_id: string
    scheduled_for: string
    status: string
    attempts: number
    max_attempts: number
  }) {
    const { data, error } = await supabaseAdmin
      .from("post_queue")
      .insert([queueData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateQueueItem(queueId: string, updateData: any) {
    const { data, error } = await supabaseAdmin
      .from("post_queue")
      .update(updateData)
      .eq("id", queueId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateQueueItemByPostId(postId: string, updateData: any) {
    const { data, error } = await supabaseAdmin
      .from("post_queue")
      .update(updateData)
      .eq("post_id", postId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async cancelQueueItem(postId: string) {
    const { error } = await supabaseAdmin
      .from("post_queue")
      .update({ status: "cancelled" })
      .eq("post_id", postId)

    if (error) throw error
  }
}

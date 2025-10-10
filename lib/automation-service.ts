import { AIService, type GeneratedPost } from "./ai-service"
import { SocialMediaService, type SocialMediaPost } from "./social-media-service"
import { DatabaseService } from "./database"

export interface AutomationJob {
  id: string
  userId: string
  socialAccountId: string
  themeId: string
  scheduledFor: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  maxAttempts: number
  errorMessage?: string
}

export interface AutomationConfig {
  userId: string
  themes: string[]
  postsPerDay: number
  postTimes: string[]
  contentStyle: string
  generateImages: boolean
  postObjective: string
  customInstructions: string
  language: string
  postFormat: string
  socialAccounts: Array<{
    id: string
    platform: string
    platformUserId: string
    accessToken: string
    isActive: boolean
  }>
}

export class AutomationService {
  /**
   * Gera posts automáticos baseados na configuração do usuário
   */
  static async generateAutomatedPosts(userId: string): Promise<void> {
    try {
      // Buscar configuração de automação do usuário
      const config = await this.getAutomationConfig(userId)
      
      if (!config || !config.socialAccounts.length) {
        console.log(`Usuário ${userId} não tem configuração de automação ou contas conectadas`)
        return
      }

      // Verificar se já foram gerados posts hoje
      const todayPosts = await DatabaseService.getPostsForToday(userId)
      const postsToday = todayPosts.length

      if (postsToday >= config.postsPerDay) {
        console.log(`Usuário ${userId} já atingiu o limite de posts para hoje (${postsToday}/${config.postsPerDay})`)
        return
      }

      // Calcular quantos posts ainda precisam ser gerados
      const remainingPosts = config.postsPerDay - postsToday

      // Gerar posts para cada conta social ativa
      for (const socialAccount of config.socialAccounts.filter(acc => acc.isActive)) {
        if (remainingPosts <= 0) break

        try {
          await this.generateAndSchedulePost(config, socialAccount)
        } catch (error) {
          console.error(`Erro ao gerar post para conta ${socialAccount.id}:`, error)
        }
      }
    } catch (error) {
      console.error(`Erro na automação para usuário ${userId}:`, error)
    }
  }

  /**
   * Gera um post individual e agenda para publicação
   */
  static async generateAndSchedulePost(
    config: AutomationConfig, 
    socialAccount: AutomationConfig['socialAccounts'][0]
  ): Promise<void> {
    try {
      // Selecionar tema aleatório
      const randomTheme = config.themes[Math.floor(Math.random() * config.themes.length)]
      
      // Calcular próximo horário de publicação
      const nextPostTime = this.calculateNextPostTime(config.postTimes)
      
      // Gerar conteúdo com IA
      const generatedPost = await AIService.generatePost({
        themes: [randomTheme],
        objective: config.postObjective as any,
        contentStyle: config.contentStyle,
        platform: socialAccount.platform,
        customInstructions: config.customInstructions,
        language: config.language,
        postFormat: config.postFormat as any,
      })

      // Gerar imagem se configurado
      let imageUrl: string | undefined
      if (config.generateImages && generatedPost.imagePrompt) {
        try {
          imageUrl = await AIService.generateImage(generatedPost.imagePrompt)
        } catch (error) {
          console.warn(`Falha ao gerar imagem para post: ${error}`)
          // Continua sem imagem se falhar
        }
      }

      // Preparar conteúdo final
      const finalContent = this.formatPostContent(generatedPost, socialAccount.platform)

      // Criar post no banco de dados
      const postData = {
        user_id: config.userId,
        social_account_id: socialAccount.id,
        content: finalContent,
        image_url: imageUrl,
        image_prompt: generatedPost.imagePrompt,
        hashtags: generatedPost.hashtags,
        scheduled_for: nextPostTime.toISOString(),
        ai_prompt: generatedPost.aiPrompt,
        generation_model: 'gpt-4o',
        status: 'scheduled',
      }

      const createdPost = await DatabaseService.createPost(postData)

      // Adicionar à fila de processamento
      await this.addToProcessingQueue({
        postId: createdPost.id,
        userId: config.userId,
        scheduledFor: nextPostTime,
      })

      console.log(`Post gerado e agendado para ${nextPostTime.toISOString()} na conta ${socialAccount.platform}`)
    } catch (error) {
      console.error(`Erro ao gerar post para conta ${socialAccount.id}:`, error)
      throw error
    }
  }

  /**
   * Processa posts agendados que estão prontos para publicação
   */
  static async processScheduledPosts(): Promise<void> {
    try {
      const readyPosts = await DatabaseService.getReadyPosts()
      
      for (const queueItem of readyPosts) {
        await this.processPost(queueItem)
      }
    } catch (error) {
      console.error('Erro ao processar posts agendados:', error)
    }
  }

  /**
   * Processa um post individual da fila
   */
  static async processPost(queueItem: any): Promise<void> {
    try {
      // Marcar como processando
      await DatabaseService.updateQueueItem(queueItem.id, { status: 'processing' })

      // Buscar dados do post e conta social
      const post = await DatabaseService.getPostById(queueItem.post_id)
      const socialAccount = await DatabaseService.getSocialAccountById(post.social_account_id)

      if (!socialAccount.is_active || !socialAccount.is_connected) {
        throw new Error('Conta social não está ativa ou conectada')
      }

      // Preparar post para publicação
      const socialMediaPost: SocialMediaPost = {
        content: post.content,
        imageUrl: post.image_url,
      }

      // Publicar na rede social
      const result = await SocialMediaService.publishPost(
        socialAccount.platform,
        socialAccount.access_token,
        socialAccount.platform_user_id,
        socialMediaPost
      )

      if (result.success) {
        // Atualizar post como publicado
        await DatabaseService.updatePostStatus(post.id, 'published', {
          published_at: new Date().toISOString(),
          platform_post_id: result.platformPostId,
        })

        // Marcar item da fila como concluído
        await DatabaseService.updateQueueItem(queueItem.id, {
          status: 'completed',
          processed_at: new Date().toISOString(),
        })

        console.log(`Post ${post.id} publicado com sucesso na ${socialAccount.platform}`)
      } else {
        throw new Error(result.error || 'Erro desconhecido na publicação')
      }
    } catch (error) {
      console.error(`Erro ao processar post ${queueItem.post_id}:`, error)
      
      // Incrementar tentativas
      const newAttempts = queueItem.attempts + 1
      const status = newAttempts >= queueItem.max_attempts ? 'failed' : 'pending'

      await DatabaseService.updateQueueItem(queueItem.id, {
        status,
        attempts: newAttempts,
        error_message: error instanceof Error ? error.message : 'Erro desconhecido',
      })

      // Se falhou definitivamente, marcar post como falhado
      if (status === 'failed') {
        await DatabaseService.updatePostStatus(queueItem.post_id, 'failed', {
          error_message: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }
  }

  /**
   * Calcula o próximo horário de publicação baseado nos horários configurados
   */
  static calculateNextPostTime(postTimes: string[]): Date {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Converter horários para minutos desde meia-noite
    const timeMinutes = postTimes.map(time => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }).sort((a, b) => a - b)

    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    // Encontrar próximo horário hoje
    for (const minutes of timeMinutes) {
      if (minutes > currentMinutes) {
        const nextTime = new Date(today.getTime() + minutes * 60 * 1000)
        return nextTime
      }
    }

    // Se não há mais horários hoje, usar o primeiro horário de amanhã
    const firstTimeTomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000 + timeMinutes[0] * 60 * 1000)
    return firstTimeTomorrow
  }

  /**
   * Formata o conteúdo do post baseado na plataforma
   */
  static formatPostContent(generatedPost: GeneratedPost, platform: string): string {
    let content = generatedPost.content

    // Adicionar hashtags
    if (generatedPost.hashtags.length > 0) {
      const hashtags = generatedPost.hashtags.map(tag => `#${tag}`).join(' ')
      content += `\n\n${hashtags}`
    }

    // Ajustes específicos por plataforma
    switch (platform.toLowerCase()) {
      case 'instagram':
        // Instagram suporta emojis e quebras de linha
        break
      case 'linkedin':
        // LinkedIn prefere texto mais profissional
        break
      case 'twitter':
        // Twitter tem limite de caracteres
        if (content.length > 280) {
          content = content.substring(0, 277) + '...'
        }
        break
      case 'facebook':
        // Facebook é mais flexível
        break
    }

    return content
  }

  /**
   * Busca configuração de automação do usuário
   */
  static async getAutomationConfig(userId: string): Promise<AutomationConfig | null> {
    try {
      const aiConfig = await DatabaseService.getAIConfiguration(userId)
      const socialAccounts = await DatabaseService.getSocialAccounts(userId)

      return {
        userId,
        themes: aiConfig.themes,
        postsPerDay: aiConfig.posts_per_day,
        postTimes: aiConfig.post_times,
        contentStyle: aiConfig.content_style,
        generateImages: aiConfig.generate_images,
        postObjective: aiConfig.post_objective,
        customInstructions: aiConfig.custom_instructions,
        language: aiConfig.language,
        postFormat: aiConfig.post_format,
        socialAccounts: socialAccounts.map(acc => ({
          id: acc.id,
          platform: acc.platform,
          platformUserId: acc.platform_user_id,
          accessToken: acc.access_token,
          isActive: acc.is_active && acc.is_connected,
        })),
      }
    } catch (error) {
      console.error(`Erro ao buscar configuração de automação para usuário ${userId}:`, error)
      return null
    }
  }

  /**
   * Adiciona post à fila de processamento
   */
  static async addToProcessingQueue(data: {
    postId: string
    userId: string
    scheduledFor: Date
  }): Promise<void> {
    const queueData = {
      post_id: data.postId,
      user_id: data.userId,
      scheduled_for: data.scheduledFor.toISOString(),
      status: 'pending',
      attempts: 0,
      max_attempts: 3,
    }

    await DatabaseService.createQueueItem(queueData)
  }

  /**
   * Executa automação para todos os usuários ativos
   */
  static async runGlobalAutomation(): Promise<void> {
    try {
      console.log('Iniciando automação global...')
      
      // Buscar todos os usuários com automação ativa
      const activeUsers = await DatabaseService.getUsersWithActiveAutomation()
      
      console.log(`Encontrados ${activeUsers.length} usuários com automação ativa`)

      // Processar cada usuário
      for (const user of activeUsers) {
        try {
          await this.generateAutomatedPosts(user.user_id)
        } catch (error) {
          console.error(`Erro na automação para usuário ${user.user_id}:`, error)
        }
      }

      // Processar posts agendados
      await this.processScheduledPosts()

      console.log('Automação global concluída')
    } catch (error) {
      console.error('Erro na automação global:', error)
    }
  }
}

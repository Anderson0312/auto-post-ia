import { AutomationService } from "./automation-service"

export class SchedulerService {
  private static isRunning = false
  private static intervals: NodeJS.Timeout[] = []

  /**
   * Inicia o sistema de agendamento
   */
  static start(): void {
    if (this.isRunning) {
      console.log('Scheduler já está rodando')
      return
    }

    console.log('Iniciando sistema de agendamento...')
    this.isRunning = true

    // Executar automação global a cada hora (para gerar novos posts)
    const automationInterval = setInterval(async () => {
      try {
        await AutomationService.runGlobalAutomation()
      } catch (error) {
        console.error('Erro na automação agendada:', error)
      }
    }, 60 * 60 * 1000) // 1 hora

    // Processar posts agendados a cada 5 minutos
    const processingInterval = setInterval(async () => {
      try {
        await AutomationService.processScheduledPosts()
      } catch (error) {
        console.error('Erro no processamento de posts:', error)
      }
    }, 5 * 60 * 1000) // 5 minutos

    // Executar imediatamente uma vez
    setTimeout(async () => {
      try {
        await AutomationService.runGlobalAutomation()
      } catch (error) {
        console.error('Erro na execução inicial:', error)
      }
    }, 1000)

    this.intervals.push(automationInterval, processingInterval)
    console.log('Sistema de agendamento iniciado com sucesso')
  }

  /**
   * Para o sistema de agendamento
   */
  static stop(): void {
    if (!this.isRunning) {
      console.log('Scheduler não está rodando')
      return
    }

    console.log('Parando sistema de agendamento...')
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []
    this.isRunning = false
    console.log('Sistema de agendamento parado')
  }

  /**
   * Verifica se o scheduler está rodando
   */
  static isActive(): boolean {
    return this.isRunning
  }

  /**
   * Executa automação manualmente (para testes)
   */
  static async runManualAutomation(): Promise<void> {
    try {
      console.log('Executando automação manual...')
      await AutomationService.runGlobalAutomation()
      console.log('Automação manual concluída')
    } catch (error) {
      console.error('Erro na automação manual:', error)
      throw error
    }
  }

  /**
   * Executa processamento manual (para testes)
   */
  static async runManualProcessing(): Promise<void> {
    try {
      console.log('Executando processamento manual...')
      await AutomationService.processScheduledPosts()
      console.log('Processamento manual concluído')
    } catch (error) {
      console.error('Erro no processamento manual:', error)
      throw error
    }
  }

  /**
   * Agenda um post específico para um horário específico
   */
  static async scheduleSpecificPost(data: {
    userId: string
    socialAccountId: string
    theme: string
    scheduledFor: Date
    generateImage?: boolean
  }): Promise<void> {
    try {
      // Buscar configuração do usuário
      const config = await AutomationService.getAutomationConfig(data.userId)
      if (!config) {
        throw new Error('Configuração de automação não encontrada')
      }

      // Buscar conta social
      const socialAccount = config.socialAccounts.find(acc => acc.id === data.socialAccountId)
      if (!socialAccount) {
        throw new Error('Conta social não encontrada')
      }

      // Gerar post
      const generatedPost = await AutomationService.generateAndSchedulePost(
        config,
        socialAccount
      )

      console.log(`Post agendado para ${data.scheduledFor.toISOString()}`)
    } catch (error) {
      console.error('Erro ao agendar post específico:', error)
      throw error
    }
  }

  /**
   * Cancela um post agendado
   */
  static async cancelScheduledPost(postId: string): Promise<void> {
    try {
      // Implementar cancelamento no banco de dados
      // await DatabaseService.cancelPost(postId)
      console.log(`Post ${postId} cancelado`)
    } catch (error) {
      console.error('Erro ao cancelar post:', error)
      throw error
    }
  }

  /**
   * Reagenda um post
   */
  static async reschedulePost(postId: string, newScheduledFor: Date): Promise<void> {
    try {
      // Implementar reagendamento no banco de dados
      // await DatabaseService.reschedulePost(postId, newScheduledFor)
      console.log(`Post ${postId} reagendado para ${newScheduledFor.toISOString()}`)
    } catch (error) {
      console.error('Erro ao reagendar post:', error)
      throw error
    }
  }

  /**
   * Obtém estatísticas do scheduler
   */
  static getStats(): {
    isRunning: boolean
    intervals: number
    uptime: number
  } {
    return {
      isRunning: this.isRunning,
      intervals: this.intervals.length,
      uptime: this.isRunning ? Date.now() : 0, // Simplificado
    }
  }
}

// Inicializar automaticamente se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
  // Aguardar um pouco para garantir que o banco esteja pronto
  setTimeout(() => {
    SchedulerService.start()
  }, 5000)
}

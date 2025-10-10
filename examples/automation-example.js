/**
 * Exemplo de uso do sistema de automação
 * 
 * Este arquivo demonstra como usar o sistema de automação
 * programaticamente para gerar e agendar posts.
 */

const { AutomationService } = require('../lib/automation-service');
const { SchedulerService } = require('../lib/scheduler');

async function exemploAutomacao() {
  console.log('=== Exemplo de Automação de Posts ===\n');

  try {
    // 1. Configurar usuário de exemplo
    const userId = 'user-example-123';
    
    console.log('1. Verificando configuração do usuário...');
    const config = await AutomationService.getAutomationConfig(userId);
    
    if (!config) {
      console.log('❌ Usuário não tem configuração de automação');
      console.log('   Configure temas, horários e contas sociais primeiro');
      return;
    }

    console.log('✅ Configuração encontrada:');
    console.log(`   - Temas: ${config.themes.join(', ')}`);
    console.log(`   - Posts por dia: ${config.postsPerDay}`);
    console.log(`   - Horários: ${config.postTimes.join(', ')}`);
    console.log(`   - Contas conectadas: ${config.socialAccounts.filter(acc => acc.isActive).length}\n`);

    // 2. Verificar posts de hoje
    console.log('2. Verificando posts de hoje...');
    const postsToday = await DatabaseService.getPostsForToday(userId);
    console.log(`   Posts gerados hoje: ${postsToday.length}/${config.postsPerDay}\n`);

    // 3. Executar automação se necessário
    if (postsToday.length < config.postsPerDay) {
      console.log('3. Executando automação...');
      await AutomationService.generateAutomatedPosts(userId);
      console.log('✅ Automação executada com sucesso\n');
    } else {
      console.log('3. ✅ Limite de posts diários já atingido\n');
    }

    // 4. Verificar posts agendados
    console.log('4. Verificando posts agendados...');
    const scheduledPosts = await DatabaseService.getScheduledPosts(userId);
    console.log(`   Posts agendados: ${scheduledPosts.length}`);
    
    scheduledPosts.forEach((post, index) => {
      const scheduledFor = new Date(post.scheduled_for).toLocaleString('pt-BR');
      console.log(`   ${index + 1}. ${post.content.substring(0, 50)}... (${scheduledFor})`);
    });
    console.log('');

    // 5. Processar posts prontos
    console.log('5. Processando posts agendados...');
    await AutomationService.processScheduledPosts();
    console.log('✅ Processamento concluído\n');

    // 6. Exemplo de agendamento específico
    console.log('6. Exemplo de agendamento específico...');
    if (config.socialAccounts.length > 0) {
      const socialAccount = config.socialAccounts[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0); // 14:00 de amanhã

      try {
        await SchedulerService.scheduleSpecificPost({
          userId,
          socialAccountId: socialAccount.id,
          theme: 'Marketing Digital',
          scheduledFor: tomorrow,
          generateImage: true
        });
        console.log(`✅ Post agendado para ${tomorrow.toLocaleString('pt-BR')}`);
      } catch (error) {
        console.log(`❌ Erro ao agendar: ${error.message}`);
      }
    }
    console.log('');

    console.log('=== Exemplo concluído ===');

  } catch (error) {
    console.error('❌ Erro no exemplo:', error.message);
  }
}

async function exemploControleScheduler() {
  console.log('\n=== Exemplo de Controle do Scheduler ===\n');

  try {
    // 1. Verificar status
    console.log('1. Status do scheduler:');
    const stats = SchedulerService.getStats();
    console.log(`   - Rodando: ${stats.isRunning ? 'Sim' : 'Não'}`);
    console.log(`   - Intervalos ativos: ${stats.intervals}\n`);

    // 2. Iniciar scheduler (se não estiver rodando)
    if (!stats.isRunning) {
      console.log('2. Iniciando scheduler...');
      SchedulerService.start();
      console.log('✅ Scheduler iniciado\n');
    } else {
      console.log('2. ✅ Scheduler já está rodando\n');
    }

    // 3. Executar automação manual
    console.log('3. Executando automação manual...');
    await SchedulerService.runManualAutomation();
    console.log('✅ Automação manual executada\n');

    // 4. Executar processamento manual
    console.log('4. Executando processamento manual...');
    await SchedulerService.runManualProcessing();
    console.log('✅ Processamento manual executado\n');

    // 5. Parar scheduler (opcional)
    console.log('5. Para parar o scheduler, use: SchedulerService.stop()');
    
    console.log('\n=== Controle do Scheduler concluído ===');

  } catch (error) {
    console.error('❌ Erro no controle do scheduler:', error.message);
  }
}

// Executar exemplos se chamado diretamente
if (require.main === module) {
  exemploAutomacao()
    .then(() => exemploControleScheduler())
    .catch(console.error);
}

module.exports = {
  exemploAutomacao,
  exemploControleScheduler
};

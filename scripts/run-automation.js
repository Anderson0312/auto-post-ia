#!/usr/bin/env node

/**
 * Script para executar automação de posts via cron job
 * 
 * Uso:
 * node scripts/run-automation.js
 * 
 * Ou adicione ao crontab:
 * 0 * * * * cd /path/to/auto-post-ia && node scripts/run-automation.js
 */

const { exec } = require('child_process');
const path = require('path');

async function runAutomation() {
  console.log(`[${new Date().toISOString()}] Iniciando execução de automação...`);
  
  try {
    // Verificar se o ambiente está configurado
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('Aviso: OPENAI_API_KEY não configurada - geração de conteúdo será limitada');
    }

    // Executar a automação via API interna
    const automationUrl = process.env.AUTOMATION_URL || 'http://localhost:3000';
    
    const response = await fetch(`${automationUrl}/api/automation/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY || 'admin-key'}` // Configure uma chave de admin
      },
      body: JSON.stringify({ action: 'run_automation' })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    console.log(`[${new Date().toISOString()}] Automação executada com sucesso:`, result.message);

    // Executar processamento de posts agendados
    const processingResponse = await fetch(`${automationUrl}/api/automation/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY || 'admin-key'}`
      },
      body: JSON.stringify({ action: 'run_processing' })
    });

    if (!processingResponse.ok) {
      const errorData = await processingResponse.json();
      throw new Error(`Erro no processamento: ${errorData.error || processingResponse.statusText}`);
    }

    const processingResult = await processingResponse.json();
    console.log(`[${new Date().toISOString()}] Processamento executado:`, processingResult.message);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro na automação:`, error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAutomation()
    .then(() => {
      console.log(`[${new Date().toISOString()}] Script de automação concluído`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`[${new Date().toISOString()}] Falha no script de automação:`, error);
      process.exit(1);
    });
}

module.exports = { runAutomation };

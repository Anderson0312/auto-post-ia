// Script para testar as notificações por e-mail
// Usando o formato de importação compatível com o projeto
import { emailService } from './lib/email-service.js';

// Função para testar todas as notificações
async function testAllNotifications() {
  const testEmail = 'usuario.teste@exemplo.com';
  const userName = 'Usuário Teste';
  
  console.log('🧪 Iniciando testes de notificações por e-mail...');
  
  // Teste 1: Notificação de post publicado
  console.log('\n📧 Testando notificação de post publicado:');
  await emailService.sendPostPublishedEmail(
    testEmail,
    userName,
    'Este é um post de teste para verificar as notificações',
    'LinkedIn',
    'https://linkedin.com/post/123456'
  );
  
  // Teste 2: Notificação de falha na publicação
  console.log('\n📧 Testando notificação de falha na publicação:');
  await emailService.sendPostFailedEmail(
    testEmail,
    userName,
    'Este post falhou ao ser publicado',
    'Twitter',
    'Erro de autenticação: Token expirado'
  );
  
  // Teste 3: Notificação de atividade da conta
  console.log('\n📧 Testando notificação de atividade da conta:');
  await emailService.sendAccountActivityEmail(
    testEmail,
    userName,
    'login em novo dispositivo',
    new Date().toISOString(),
    'aplicação web'
  );
  
  // Teste 4: Notificação de atualização do sistema
  console.log('\n📧 Testando notificação de atualização do sistema:');
  await emailService.sendSystemUpdateEmail(
    testEmail,
    userName,
    'Atualização importante do sistema',
    [
      'Nova funcionalidade de notificações por e-mail',
      'Melhorias na interface do usuário',
      'Correções de bugs'
    ]
  );
  
  console.log('\n✅ Todos os testes de notificações concluídos!');
}

// Executar os testes
testAllNotifications()
  .then(() => console.log('Testes finalizados com sucesso!'))
  .catch(error => console.error('Erro nos testes:', error));
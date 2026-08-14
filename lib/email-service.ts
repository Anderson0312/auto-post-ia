// Email service for sending various types of emails
// In production, you would use a service like SendGrid, Mailgun, or AWS SES

// Base email template
const createEmailTemplate = (title: string, content: string, buttonText?: string, buttonUrl?: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title} - AutoPostIA</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">AutoPostIA</h1>
          </div>
          
          ${content}
          
          ${buttonText && buttonUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${buttonUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              ${buttonText}
            </a>
          </div>
          ` : ''}
          
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #999;">
            <p>AutoPostIA - Automatize suas redes sociais com IA</p>
            <p>Você pode gerenciar suas preferências de e-mail nas <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color: #2563eb;">configurações da sua conta</a>.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

// Função genérica para enviar e-mail
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const emailContent = { to, subject, html }

  // In development, just log the email content
  if (process.env.NODE_ENV === "development") {
    console.log(`📧 Email: ${subject}`, emailContent)
    return
  }

  // In production, send actual email using your preferred service
  try {
    // Example with SendGrid (you would need to install @sendgrid/mail)
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    // await sgMail.send(emailContent)

    // For now, we'll simulate sending
    console.log("Email sent successfully to:", to)
  } catch (error) {
    console.error("Error sending email:", error)
    throw new Error("Falha ao enviar e-mail")
  }
}

// Objeto para exportar todas as funções de e-mail
export const emailService = {
  sendPasswordResetEmail,
  sendPostPublishedEmail,
  sendPostFailedEmail,
  sendAccountActivityEmail,
  sendSystemUpdateEmail,
  sendEmail
}

// Password reset email
export async function sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
  
  const content = `
    <h2>Olá, ${name}!</h2>
    
    <p>Você solicitou a redefinição da sua senha no AutoPostIA.</p>
    
    <p>Clique no botão abaixo para redefinir sua senha:</p>
    
    <p>Ou copie e cole este link no seu navegador:</p>
    <p style="word-break: break-all; color: #666;">${resetUrl}</p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="font-size: 14px; color: #666;">
        <strong>Importante:</strong>
      </p>
      <ul style="font-size: 14px; color: #666;">
        <li>Este link expira em 1 hora por segurança</li>
        <li>Se você não solicitou esta redefinição, ignore este e-mail</li>
        <li>Sua senha atual permanece inalterada até que você defina uma nova</li>
      </ul>
    </div>
  `
  
  const html = createEmailTemplate("Redefinir Senha", content, "Redefinir Senha", resetUrl)
  await sendEmail(email, "AutoPostIA - Redefinir Senha", html)
}

// Post published notification
async function sendPostPublishedEmail(
  email: string, 
  name: string, 
  postTitle: string, 
  network: string,
  postUrl?: string
): Promise<void> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  
  const content = `
    <h2>Olá, ${name}!</h2>
    
    <p>Seu post <strong>"${postTitle}"</strong> foi publicado com sucesso no ${network}.</p>
    
    ${postUrl ? `<p>Você pode visualizar seu post <a href="${postUrl}" style="color: #2563eb;">clicando aqui</a>.</p>` : ''}
    
    <p>Continue acompanhando o desempenho das suas publicações no painel de controle.</p>
  `
  
  const html = createEmailTemplate("Post Publicado com Sucesso", content, "Ver Dashboard", dashboardUrl)
  await sendEmail(email, `AutoPostIA - Post Publicado no ${network}`, html)
}

// Post failed notification
async function sendPostFailedEmail(
  email: string, 
  name: string, 
  postTitle: string, 
  network: string,
  errorMessage: string
): Promise<void> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  
  const content = `
    <h2>Olá, ${name}!</h2>
    
    <p>Infelizmente, ocorreu um erro ao tentar publicar seu post <strong>"${postTitle}"</strong> no ${network}.</p>
    
    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #B91C1C;"><strong>Erro:</strong> ${errorMessage}</p>
    </div>
    
    <p>Você pode tentar publicar novamente ou verificar as configurações da sua conta ${network}.</p>
  `
  
  const html = createEmailTemplate("Falha na Publicação", content, "Ver Dashboard", dashboardUrl)
  await sendEmail(email, `AutoPostIA - Falha na Publicação no ${network}`, html)
}

// Account activity notification
async function sendAccountActivityEmail(
  email: string, 
  name: string, 
  activity: string,
  details: string
): Promise<void> {
  const settingsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`
  
  const content = `
    <h2>Olá, ${name}!</h2>
    
    <p>Detectamos a seguinte atividade em sua conta:</p>
    
    <div style="background-color: #F0F9FF; border-left: 4px solid #0EA5E9; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #0369A1;"><strong>${activity}</strong></p>
      <p style="margin: 8px 0 0 0; color: #0369A1;">${details}</p>
    </div>
    
    <p>Se você não reconhece esta atividade, recomendamos que altere sua senha imediatamente.</p>
  `
  
  const html = createEmailTemplate("Atividade na Conta", content, "Configurações de Segurança", settingsUrl)
  await sendEmail(email, "AutoPostIA - Atividade na Conta", html)
}

// System update notification
async function sendSystemUpdateEmail(
  email: string, 
  name: string, 
  updateTitle: string,
  updateDetails: string[]
): Promise<void> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  
  const updateList = updateDetails.map(detail => `<li style="margin-bottom: 8px;">${detail}</li>`).join('')
  
  const content = `
    <h2>Olá, ${name}!</h2>
    
    <p>Temos novidades para você! O AutoPostIA acaba de receber uma atualização:</p>
    
    <div style="background-color: #F0FDF4; border-left: 4px solid #22C55E; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #166534;">${updateTitle}</h3>
      <ul style="margin: 0; padding-left: 20px; color: #166534;">
        ${updateList}
      </ul>
    </div>
    
    <p>Experimente agora mesmo essas novidades!</p>
  `
  
  const html = createEmailTemplate("Novidades no Sistema", content, "Acessar Dashboard", dashboardUrl)
  await sendEmail(email, `AutoPostIA - ${updateTitle}`, html)
}

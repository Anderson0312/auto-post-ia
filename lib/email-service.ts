// Email service for sending password reset emails
// In production, you would use a service like SendGrid, Mailgun, or AWS SES

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

  const emailContent = {
    to: email,
    subject: "AutoPostIA - Redefinir Senha",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redefinir Senha - AutoPostIA</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb;">AutoPostIA</h1>
            </div>
            
            <h2>Olá, ${name}!</h2>
            
            <p>Você solicitou a redefinição da sua senha no AutoPostIA.</p>
            
            <p>Clique no botão abaixo para redefinir sua senha:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Redefinir Senha
              </a>
            </div>
            
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
            
            <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #999;">
              <p>AutoPostIA - Automatize suas redes sociais com IA</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  // In development, just log the email content
  if (process.env.NODE_ENV === "development") {
    console.log("📧 Password Reset Email:", emailContent)
    console.log("🔗 Reset URL:", resetUrl)
    return
  }

  // In production, send actual email using your preferred service
  try {
    // Example with SendGrid (you would need to install @sendgrid/mail)
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    // await sgMail.send(emailContent)

    // For now, we'll simulate sending
    console.log("Email sent successfully to:", email)
  } catch (error) {
    console.error("Error sending email:", error)
    throw new Error("Falha ao enviar e-mail de recuperação")
  }
}

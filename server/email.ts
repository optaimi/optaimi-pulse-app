import * as brevo from '@getbrevo/brevo'

const apiInstance = new brevo.TransactionalEmailsApi()
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ''
)

export async function sendMagicLinkEmail(params: {
  to: string
  url: string
}) {
  const sendSmtpEmail = new brevo.SendSmtpEmail()

  sendSmtpEmail.subject = 'Sign in to Optaimi Pulse'
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Sign in to Optaimi Pulse</h1>
          <p>Click the button below to sign in to your account:</p>
          <p style="margin: 30px 0;">
            <a href="${params.url}" class="button">Sign In</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${params.url}</p>
          <div class="footer">
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this email, you can safely ignore it.</p>
          </div>
        </div>
      </body>
    </html>
  `
  sendSmtpEmail.sender = { name: 'Optaimi Pulse', email: 'pulse@optaimi.com' }
  sendSmtpEmail.to = [{ email: params.to }]

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail)
    console.log('Magic link email sent successfully:', data)
    return data
  } catch (error) {
    console.error('Error sending magic link email:', error)
    throw error
  }
}

export async function sendAlertEmail(params: {
  to: string
  alertType: string
  model: string
  metric: string
  value: string
  threshold: string
  timestamp: string
}) {
  const sendSmtpEmail = new brevo.SendSmtpEmail()

  sendSmtpEmail.subject = `⚠️ Alert: ${params.alertType} threshold exceeded for ${params.model}`
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; }
          .metric { background-color: #f9fafb; padding: 12px; border-radius: 6px; margin: 10px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚨 Alert Triggered</h1>
          <div class="alert">
            <strong>${params.alertType}</strong> alert for <strong>${params.model}</strong>
          </div>
          <div class="metric">
            <p><strong>Metric:</strong> ${params.metric}</p>
            <p><strong>Current Value:</strong> ${params.value}</p>
            <p><strong>Threshold:</strong> ${params.threshold}</p>
            <p><strong>Time:</strong> ${params.timestamp}</p>
          </div>
          <p style="margin: 30px 0;">
            <a href="${process.env.APP_BASE_URL}/dashboard" class="button">View Dashboard</a>
          </p>
        </div>
      </body>
    </html>
  `
  sendSmtpEmail.sender = { name: 'Optaimi Pulse', email: 'pulse@optaimi.com' }
  sendSmtpEmail.to = [{ email: params.to }]

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail)
    console.log('Alert email sent successfully:', data)
    return data
  } catch (error) {
    console.error('Error sending alert email:', error)
    throw error
  }
}

import * as brevo from '@getbrevo/brevo'

const apiInstance = new brevo.TransactionalEmailsApi()
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ''
)

interface EmailParams {
  to: string
  subject: string
  htmlContent: string
}

/**
 * Send an email via Brevo
 */
async function sendEmail({ to, subject, htmlContent }: EmailParams) {
  const sendSmtpEmail = new brevo.SendSmtpEmail()
  
  sendSmtpEmail.sender = { 
    name: 'Optaimi Pulse', 
    email: 'noreply@optaimipulse.com' 
  }
  sendSmtpEmail.to = [{ email: to }]
  sendSmtpEmail.subject = subject
  sendSmtpEmail.htmlContent = htmlContent

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail)
    console.log(`Email sent to ${to}: ${subject}`)
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error)
    throw new Error('Failed to send email')
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.APP_BASE_URL || process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f172a; color: #e6e9ef; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Welcome to Optaimi Pulse!</p>
            <p>Please verify your email address by clicking the button below:</p>
            <a href="${verifyUrl}" class="button">Verify Email</a>
            <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:<br>
            ${verifyUrl}</p>
            <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour.</p>
          </div>
          <div class="footer">
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `

  await sendEmail({
    to: email,
    subject: 'Verify your email - Optaimi Pulse',
    htmlContent,
  })
}

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(email: string, token: string) {
  const magicUrl = `${process.env.APP_BASE_URL || process.env.NEXTAUTH_URL}/api/auth/magic-link/verify?token=${token}`
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f172a; color: #e6e9ef; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Sign In to Optaimi Pulse</h1>
          </div>
          <div class="content">
            <p>Click the button below to sign in to your account:</p>
            <a href="${magicUrl}" class="button">Sign In</a>
            <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:<br>
            ${magicUrl}</p>
            <p style="color: #64748b; font-size: 14px;">This link will expire in 15 minutes.</p>
          </div>
          <div class="footer">
            <p>If you didn't request this email, you can safely ignore it.</p>
          </div>
        </div>
      </body>
    </html>
  `

  await sendEmail({
    to: email,
    subject: 'Sign in to Optaimi Pulse',
    htmlContent,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.APP_BASE_URL || process.env.NEXTAUTH_URL}/reset-password?token=${token}`
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f172a; color: #e6e9ef; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Reset Your Password</h1>
          </div>
          <div class="content">
            <p>We received a request to reset your password for Optaimi Pulse.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:<br>
            ${resetUrl}</p>
            <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour.</p>
          </div>
          <div class="footer">
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `

  await sendEmail({
    to: email,
    subject: 'Reset your password - Optaimi Pulse',
    htmlContent,
  })
}

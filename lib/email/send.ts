import { Resend } from 'resend'
import { emailTemplates, EmailTemplate } from './templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await resend.emails.send({
      from: 'MidasAI <noreply@midasai.tech>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }

    console.log('Email sent successfully:', data)
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.welcome(name)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

export async function sendVerificationEmail(email: string, name: string, verificationUrl: string): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.emailVerification(name, verificationUrl)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.passwordReset(name, resetUrl)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

export async function sendPurchaseConfirmationEmail(email: string, name: string, itemName: string, price: number): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.purchaseConfirmation(name, itemName, price)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

export async function sendSubscriptionUpdatedEmail(email: string, name: string, plan: string): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.subscriptionUpdated(name, plan)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

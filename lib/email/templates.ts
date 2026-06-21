export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export const emailTemplates = {
  welcome: (name: string): EmailTemplate => ({
    subject: 'Welcome to MidasAI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to MidasAI</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; line-height: 1.6;">Welcome to MidasAI - the world's best marketplace for AI skills, workflows, and templates!</p>
          <p style="font-size: 16px; line-height: 1.6;">We're excited to have you on board. Here's what you can do:</p>
          <ul style="font-size: 16px; line-height: 1.6;">
            <li>Browse thousands of AI-powered resources</li>
            <li>Sell your own creations</li>
            <li>Connect with other developers</li>
          </ul>
          <p style="font-size: 16px; line-height: 1.6;">If you have any questions, feel free to reach out to our support team.</p>
          <p style="font-size: 16px; line-height: 1.6;">Best regards,<br>The MidasAI Team</p>
        </div>
      </div>
    `,
    text: `Hi ${name},\n\nWelcome to MidasAI - the world's best marketplace for AI skills, workflows, and templates!\n\nWe're excited to have you on board. Here's what you can do:\n- Browse thousands of AI-powered resources\n- Sell your own creations\n- Connect with other developers\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nThe MidasAI Team`,
  }),

  emailVerification: (name: string, verificationUrl: string): EmailTemplate => ({
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Verify Your Email</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; line-height: 1.6;">Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">Verify Email</a>
          </div>
          <p style="font-size: 14px; color: #666;">This link will expire in 24 hours.</p>
          <p style="font-size: 16px; line-height: 1.6;">If you didn't create an account, you can safely ignore this email.</p>
          <p style="font-size: 16px; line-height: 1.6;">Best regards,<br>The MidasAI Team</p>
        </div>
      </div>
    `,
    text: `Hi ${name},\n\nPlease verify your email address to complete your registration.\n\nClick the link below to verify:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.\n\nBest regards,\nThe MidasAI Team`,
  }),

  passwordReset: (name: string, resetUrl: string): EmailTemplate => ({
    subject: 'Reset your password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Reset Your Password</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; line-height: 1.6;">We received a request to reset your password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #666;">This link will expire in 1 hour.</p>
          <p style="font-size: 16px; line-height: 1.6;">If you didn't request a password reset, you can safely ignore this email.</p>
          <p style="font-size: 16px; line-height: 1.6;">Best regards,<br>The MidasAI Team</p>
        </div>
      </div>
    `,
    text: `Hi ${name},\n\nWe received a request to reset your password.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.\n\nBest regards,\nThe MidasAI Team`,
  }),

  purchaseConfirmation: (name: string, itemName: string, price: number): EmailTemplate => ({
    subject: 'Purchase Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Purchase Confirmation</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; line-height: 1.6;">Thank you for your purchase!</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.6;"><strong>Item:</strong> ${itemName}</p>
            <p style="font-size: 16px; line-height: 1.6;"><strong>Price:</strong> $${price.toFixed(2)}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6;">You can access your purchase from your dashboard.</p>
          <p style="font-size: 16px; line-height: 1.6;">Best regards,<br>The MidasAI Team</p>
        </div>
      </div>
    `,
    text: `Hi ${name},\n\nThank you for your purchase!\n\nItem: ${itemName}\nPrice: $${price.toFixed(2)}\n\nYou can access your purchase from your dashboard.\n\nBest regards,\nThe MidasAI Team`,
  }),

  subscriptionUpdated: (name: string, plan: string): EmailTemplate => ({
    subject: 'Subscription Updated',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Subscription Updated</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p style="font-size: 16px; line-height: 1.6;">Hi ${name},</p>
          <p style="font-size: 16px; line-height: 1.6;">Your subscription has been updated to the <strong>${plan}</strong> plan.</p>
          <p style="font-size: 16px; line-height: 1.6;">You now have access to all the features included in your new plan.</p>
          <p style="font-size: 16px; line-height: 1.6;">Best regards,<br>The MidasAI Team</p>
        </div>
      </div>
    `,
    text: `Hi ${name},\n\nYour subscription has been updated to the ${plan} plan.\n\nYou now have access to all the features included in your new plan.\n\nBest regards,\nThe MidasAI Team`,
  }),
}

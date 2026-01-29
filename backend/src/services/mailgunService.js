import { getDatabase } from '../database/init.js'
import { decryptText } from './encryptionService.js'

/**
 * Get Mailgun configuration from settings
 * @returns {{ apiKey: string, domain: string, fromEmail: string } | null}
 */
export function getMailgunConfig() {
  const db = getDatabase()

  const apiKeyRow = db.prepare('SELECT value, is_encrypted FROM settings WHERE key = ?').get('mailgun_api_key')
  const domainRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('mailgun_domain')
  const fromEmailRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('mailgun_from_email')

  if (!apiKeyRow?.value || !domainRow?.value) {
    return null
  }

  const apiKey = apiKeyRow.is_encrypted ? decryptText(apiKeyRow.value) : apiKeyRow.value
  const domain = domainRow.value
  const fromEmail = fromEmailRow?.value || `noreply@${domain}`

  return { apiKey, domain, fromEmail }
}

/**
 * Check if Mailgun is configured
 * @returns {boolean}
 */
export function isMailgunConfigured() {
  return getMailgunConfig() !== null
}

/**
 * Send email via Mailgun API
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
export async function sendEmail({ to, subject, text, html }) {
  const config = getMailgunConfig()

  if (!config) {
    throw new Error('Mailgun is not configured. Please configure Mailgun settings in the admin panel.')
  }

  const { apiKey, domain, fromEmail } = config

  // Build form data for Mailgun API
  const formData = new URLSearchParams()
  formData.append('from', fromEmail)
  formData.append('to', to)
  formData.append('subject', subject)
  formData.append('text', text)
  if (html) {
    formData.append('html', html)
  }

  // Mailgun API endpoint
  const url = `https://api.mailgun.net/v3/${domain}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Mailgun API error:', response.status, errorText)
    throw new Error(`Failed to send email: ${response.status} ${errorText}`)
  }

  const result = await response.json()
  return result
}

/**
 * Send password reset email
 * @param {string} toEmail - Recipient email
 * @param {string} firstName - User's first name
 * @param {string} resetLink - Password reset URL
 */
export async function sendPasswordResetEmail(toEmail, firstName, resetLink) {
  const subject = 'Reset Your Password - Optimal Prime Services'

  const text = `Hello ${firstName},

You requested to reset your password for your Optimal Prime Services onboarding account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Best regards,
Optimal Prime Services Team`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png" alt="Optimal Prime Services" style="max-width: 200px; height: auto;">
  </div>
  
  <h2 style="color: #1e40af; margin-bottom: 20px;">Reset Your Password</h2>
  
  <p>Hello ${firstName},</p>
  
  <p>You requested to reset your password for your Optimal Prime Services onboarding account.</p>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="${resetLink}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
  </p>
  
  <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
  <p style="color: #1e40af; word-break: break-all; font-size: 14px;">${resetLink}</p>
  
  <p style="color: #dc2626; font-size: 14px;"><strong>This link will expire in 1 hour.</strong></p>
  
  <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="color: #666; font-size: 12px; text-align: center;">
    © ${new Date().getFullYear()} Optimal Prime Services. All rights reserved.
  </p>
</body>
</html>`

  return await sendEmail({ to: toEmail, subject, text, html })
}

/**
 * Send test email to verify Mailgun configuration
 * @param {string} toEmail - Recipient email for test
 */
export async function sendTestEmail(toEmail) {
  const subject = 'Test Email - Optimal Prime Services'

  const text = `This is a test email from your Optimal Prime Services onboarding system.

If you received this email, your Mailgun configuration is working correctly!

Best regards,
Optimal Prime Services`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png" alt="Optimal Prime Services" style="max-width: 200px; height: auto;">
  </div>
  
  <div style="background-color: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; text-align: center;">
    <h2 style="color: #059669; margin: 0 0 10px 0;">✓ Test Successful!</h2>
    <p style="margin: 0; color: #065f46;">Your Mailgun configuration is working correctly.</p>
  </div>
  
  <p style="margin-top: 20px;">This is a test email from your Optimal Prime Services onboarding system.</p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p style="color: #666; font-size: 12px; text-align: center;">
    © ${new Date().getFullYear()} Optimal Prime Services. All rights reserved.
  </p>
</body>
</html>`

  return await sendEmail({ to: toEmail, subject, text, html })
}

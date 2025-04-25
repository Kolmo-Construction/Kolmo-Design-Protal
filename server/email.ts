import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set. Email functionality will not work.");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

// Default sender email - should be configured appropriately in a real application
const DEFAULT_FROM_EMAIL = 'noreply@constructionportal.com';

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error("Cannot send email: SENDGRID_API_KEY is not set");
    return false;
  }

  try {
    const msg = {
      to: options.to,
      from: options.from || DEFAULT_FROM_EMAIL,
      subject: options.subject,
      text: options.text || '',
      html: options.html || '',
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a magic link invitation email to a user
 */
export async function sendMagicLinkEmail(
  email: string, 
  firstName: string, 
  magicLink: string, 
  isNewUser: boolean
): Promise<boolean> {
  const subject = isNewUser 
    ? 'Welcome to Construction Client Portal - Activate Your Account' 
    : 'Access Your Construction Client Portal Account';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #3d4f52; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Construction Client Portal</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
        <p>Hello ${firstName},</p>
        
        ${isNewUser 
          ? `<p>Welcome to the Construction Client Portal! We've created an account for you to access your project information.</p>` 
          : `<p>You've requested access to your Construction Client Portal account.</p>`
        }
        
        <p>Please click the button below to ${isNewUser ? 'set up your account' : 'sign in'}:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLink}" 
             style="background-color: #d8973c; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            ${isNewUser ? 'Activate My Account' : 'Sign In'}
          </a>
        </div>
        
        <p>This link will expire in 24 hours for security reasons.</p>
        
        <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
        <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; font-size: 12px;">${magicLink}</p>
        
        <p>If you didn't request this email, please ignore it.</p>
        
        <p>Thank you,<br>Construction Client Portal Team</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  `;

  const text = `
Hello ${firstName},

${isNewUser 
  ? 'Welcome to the Construction Client Portal! We\'ve created an account for you to access your project information.' 
  : 'You\'ve requested access to your Construction Client Portal account.'
}

Please use the following link to ${isNewUser ? 'set up your account' : 'sign in'}:
${magicLink}

This link will expire in 24 hours for security reasons.

If you didn't request this email, please ignore it.

Thank you,
Construction Client Portal Team
`;

  return sendEmail({
    to: email,
    subject,
    html,
    text
  });
}
import { Injectable } from '@nestjs/common';

/**
 * SRP: HTML email templates only — no transport logic.
 */
@Injectable()
export class EmailTemplateService {
  verificationEmail(name: string, otp: string): string {
    return this.wrap({
      headerColor: '#4CAF50',
      title: 'Email Verification',
      name,
      body: `
        <p>Thank you for signing up! Please use the OTP below to verify your email address:</p>
        <div class="otp" style="font-size:32px;font-weight:bold;color:#4CAF50;text-align:center;padding:20px;background:white;margin:20px 0;">${otp}</div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  passwordResetEmail(name: string, otp: string): string {
    return this.wrap({
      headerColor: '#FF5722',
      title: 'Password Reset Request',
      name,
      body: `
        <p>We received a request to reset your password. Use the OTP below to proceed:</p>
        <div class="otp" style="font-size:32px;font-weight:bold;color:#FF5722;text-align:center;padding:20px;background:white;margin:20px 0;">${otp}</div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      `,
    });
  }

  passwordResetConfirmation(name: string): string {
    return this.wrap({
      headerColor: '#4CAF50',
      title: 'Password Reset Successful',
      name,
      body: `
        <p>Your password has been successfully reset.</p>
        <p>If you didn't make this change, please contact our support team immediately.</p>
      `,
    });
  }

  systemPasswordEmail(name: string, email: string, password: string): string {
    return this.wrap({
      headerColor: '#2196F3',
      title: 'Welcome to Mail Service',
      name,
      body: `
        <p>Your account has been created successfully. Here are your login credentials:</p>
        <div style="background:white;padding:20px;margin:20px 0;border-left:4px solid #2196F3;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p><strong>Important:</strong> Please change your password after your first login.</p>
      `,
    });
  }

  private wrap(opts: { headerColor: string; title: string; name: string; body: string }): string {
    const year = new Date().getFullYear();
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${opts.headerColor}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${opts.title}</h1></div>
          <div class="content">
            <h2>Hello ${opts.name},</h2>
            ${opts.body}
          </div>
          <div class="footer"><p>© ${year} Mail Service. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `;
  }
}

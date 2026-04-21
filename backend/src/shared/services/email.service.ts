import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureEmailService } from './azure-email.service';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{
    name: string;
    contentType: string;
    contentInBase64: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private azureEmailService: AzureEmailService;

  constructor(
    private configService: ConfigService,
    azureEmailService: AzureEmailService,
  ) {
    this.azureEmailService = azureEmailService;
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('email.host');
    const port = this.configService.get<number>('email.port');
    const user = this.configService.get<string>('email.user');
    const password = this.configService.get<string>('email.password');

    if (!host || !port || !user || !password) {
      this.logger.warn(
        'NodeMailer configuration is incomplete. Will use Azure email if configured.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass: password,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const { to, subject, html, attachments } = options;

    // Try Azure Communication Services first
    if (this.azureEmailService.isConfigured()) {
      try {
        const success = await this.azureEmailService.sendEmail({
          to,
          subject,
          htmlContent: html,
          attachments,
        });

        if (success) {
          this.logger.log(`Email sent successfully via Azure to ${to}`);
          return;
        } else {
          this.logger.warn('Azure email failed, falling back to NodeMailer');
        }
      } catch (error) {
        this.logger.warn('Azure email service error, falling back to NodeMailer:', error);
      }
    }

    // Fallback to NodeMailer
    if (!this.transporter) {
      this.logger.warn('No email service configured. Skipping email send.');
      this.logger.debug('Email would have been sent:', { to, subject });
      return;
    }

    const { from } = options;
    const defaultFrom = this.configService.get<string>('email.from');

    try {
      await this.transporter.sendMail({
        from: from || defaultFrom,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent successfully via NodeMailer to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(name: string, email: string, otp: string): Promise<void> {
    const html = this.verificationEmailTemplate(name, email, otp);

    await this.sendEmail({
      to: email,
      subject: 'Account Verification - Mail Service',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(name: string, email: string, otp: string): Promise<void> {
    const html = this.passwordResetEmailTemplate(name, email, otp);

    await this.sendEmail({
      to: email,
      subject: 'Password Reset - Mail Service',
      html,
    });
  }

  /**
   * Send password reset confirmation email
   */
  async sendPasswordResetConfirmation(name: string, email: string): Promise<void> {
    const html = this.passwordResetConfirmationTemplate(name);

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Confirmation - Mail Service',
      html,
    });
  }

  /**
   * Send system-generated password email
   */
  async sendSystemPasswordEmail(name: string, email: string, password: string): Promise<void> {
    const html = this.systemPasswordEmailTemplate(name, email, password);

    await this.sendEmail({
      to: email,
      subject: 'Your Account Credentials - Mail Service',
      html,
    });
  }

  // Email Templates

  private verificationEmailTemplate(name: string, email: string, otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .otp { font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; padding: 20px; background: white; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for signing up! Please use the OTP below to verify your email address:</p>
            <div class="otp">${otp}</div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Mail Service. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private passwordResetEmailTemplate(name: string, email: string, otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF5722; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .otp { font-size: 32px; font-weight: bold; color: #FF5722; text-align: center; padding: 20px; background: white; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
            <div class="otp">${otp}</div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Mail Service. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private passwordResetConfirmationTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Successful</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your password has been successfully reset.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Mail Service. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private systemPasswordEmailTemplate(name: string, email: string, password: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .credentials { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2196F3; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Mail Service</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your account has been created successfully. Here are your login credentials:</p>
            <div class="credentials">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>
            <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Mail Service. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

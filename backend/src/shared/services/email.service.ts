import { Inject, Injectable, Logger } from '@nestjs/common';
import { EMAIL_TRANSPORTS } from '@shared/tokens';
import { EmailPayload, IEmailTransport } from '@shared/interfaces/email-transport.interface';
import { EmailTemplateService } from './email-template.service';

export type EmailOptions = EmailPayload;

/**
 * Facade over email transports (Strategy chain) + templates.
 * SRP: orchestration only — templates and transports live elsewhere.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(EMAIL_TRANSPORTS) private readonly transports: IEmailTransport[],
    private readonly templates: EmailTemplateService,
  ) {}

  async sendEmail(options: EmailOptions): Promise<void> {
    const available = this.transports.filter((t) => t.isAvailable());

    if (available.length === 0) {
      this.logger.warn('No email transport configured. Skipping send.');
      this.logger.debug('Email would have been sent:', {
        to: options.to,
        subject: options.subject,
      });
      return;
    }

    for (const transport of available) {
      try {
        const sent = await transport.send(options);
        if (sent) {
          this.logger.log(`Email sent via ${transport.name} to ${options.to}`);
          return;
        }
        this.logger.warn(`${transport.name} returned false, trying next transport`);
      } catch (error) {
        this.logger.warn(`${transport.name} error, trying next transport:`, error);
      }
    }

    throw new Error(`Failed to send email to ${options.to} via all transports`);
  }

  async sendVerificationEmail(name: string, email: string, otp: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Account Verification - Mail Service',
      html: this.templates.verificationEmail(name, otp),
    });
  }

  async sendPasswordResetEmail(name: string, email: string, otp: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Password Reset - Mail Service',
      html: this.templates.passwordResetEmail(name, otp),
    });
  }

  async sendPasswordResetConfirmation(name: string, email: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Password Reset Confirmation - Mail Service',
      html: this.templates.passwordResetConfirmation(name),
    });
  }

  async sendSystemPasswordEmail(name: string, email: string, password: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Your Account Credentials - Mail Service',
      html: this.templates.systemPasswordEmail(name, email, password),
    });
  }
}

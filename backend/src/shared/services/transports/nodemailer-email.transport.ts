import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailPayload, IEmailTransport } from '@shared/interfaces/email-transport.interface';

/**
 * Strategy: SMTP / Nodemailer email transport.
 */
@Injectable()
export class NodemailerEmailTransport implements IEmailTransport {
  readonly name = 'nodemailer';
  private readonly logger = new Logger(NodemailerEmailTransport.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private initialize(): void {
    const host = this.configService.get<string>('email.host');
    const port = this.configService.get<number>('email.port');
    const user = this.configService.get<string>('email.user');
    const password = this.configService.get<string>('email.password');

    if (!host || !port || !user || !password) {
      this.logger.warn('Nodemailer configuration incomplete.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
    });
  }

  isAvailable(): boolean {
    return this.transporter !== null;
  }

  async send(payload: EmailPayload): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    const defaultFrom = this.configService.get<string>('email.from');

    try {
      await this.transporter.sendMail({
        from: payload.from || defaultFrom,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      this.logger.log(`Email sent via Nodemailer to ${payload.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Nodemailer failed for ${payload.to}:`, error);
      throw error;
    }
  }
}

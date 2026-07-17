import { Injectable, Logger } from '@nestjs/common';
import { AzureEmailService } from '../azure-email.service';
import { EmailPayload, IEmailTransport } from '@shared/interfaces/email-transport.interface';

/**
 * Strategy: Azure Communication Services email transport.
 */
@Injectable()
export class AzureEmailTransport implements IEmailTransport {
  readonly name = 'azure';
  private readonly logger = new Logger(AzureEmailTransport.name);

  constructor(private readonly azureEmailService: AzureEmailService) {}

  isAvailable(): boolean {
    return this.azureEmailService.isConfigured();
  }

  async send(payload: EmailPayload): Promise<boolean> {
    try {
      return await this.azureEmailService.sendEmail({
        to: payload.to,
        subject: payload.subject,
        htmlContent: payload.html,
        attachments: payload.attachments,
      });
    } catch (error) {
      this.logger.warn(`Azure transport failed: ${error}`);
      return false;
    }
  }
}

import { Module, Global } from '@nestjs/common';
import { AzureEmailService } from './services/azure-email.service';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { AzureEmailTransport } from './services/transports/azure-email.transport';
import { NodemailerEmailTransport } from './services/transports/nodemailer-email.transport';
import { EMAIL_TRANSPORTS } from './tokens';

/**
 * Email feature module (Strategy transports + Facade).
 * Import where needed — not dumped into every feature via SharedModule.
 */
@Global()
@Module({
  providers: [
    AzureEmailService,
    AzureEmailTransport,
    NodemailerEmailTransport,
    EmailTemplateService,
    {
      provide: EMAIL_TRANSPORTS,
      useFactory: (azure: AzureEmailTransport, smtp: NodemailerEmailTransport) => [azure, smtp],
      inject: [AzureEmailTransport, NodemailerEmailTransport],
    },
    EmailService,
  ],
  exports: [EmailService, EmailTemplateService, AzureEmailService],
})
export class EmailModule {}

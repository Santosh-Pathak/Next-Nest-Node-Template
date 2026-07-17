import { Module, Global } from '@nestjs/common';
import { AzureBlobService } from './services/azure-blob.service';
import { AzureEmailService } from './services/azure-email.service';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { FactoryService } from './services/factory.service';
import { AzureEmailTransport } from './services/transports/azure-email.transport';
import { NodemailerEmailTransport } from './services/transports/nodemailer-email.transport';
import { STORAGE_SERVICE, EMAIL_TRANSPORTS } from './tokens';

@Global()
@Module({
  providers: [
    FactoryService,
    AzureBlobService,
    {
      provide: STORAGE_SERVICE,
      useExisting: AzureBlobService,
    },
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
  exports: [
    FactoryService,
    AzureBlobService,
    STORAGE_SERVICE,
    AzureEmailService,
    EmailService,
    EmailTemplateService,
  ],
})
export class SharedModule {}

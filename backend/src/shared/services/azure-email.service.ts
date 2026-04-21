import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailClient, EmailMessage } from '@azure/communication-email';

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface AzureEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  template?: EmailTemplate;
  attachments?: Array<{
    name: string;
    contentType: string;
    contentInBase64: string;
  }>;
}

@Injectable()
export class AzureEmailService {
  private readonly logger = new Logger(AzureEmailService.name);
  private emailClient: EmailClient | null = null;
  private senderAddress: string;
  private adminEmail: string;

  constructor(private configService: ConfigService) {
    this.initializeEmailClient();
  }

  private initializeEmailClient() {
    const connectionString = this.configService.get<string>(
      'AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING',
    );
    const senderAddress = this.configService.get<string>('AZURE_SENDER_EMAIL');
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');

    if (!connectionString || !senderAddress) {
      this.logger.warn(
        'Azure Communication Services not configured. Email sending will be disabled.',
      );
      this.logger.warn(
        'Please set AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING and AZURE_SENDER_EMAIL',
      );
      return;
    }

    try {
      this.emailClient = new EmailClient(connectionString);
      this.senderAddress = senderAddress;
      this.adminEmail = adminEmail || 'admin@example.com';
      this.logger.log('Azure Communication Services email client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Azure email client:', error);
    }
  }

  /**
   * Send email using Azure Communication Services
   */
  async sendEmail(options: AzureEmailOptions): Promise<boolean> {
    if (!this.emailClient) {
      this.logger.warn('Azure email client not initialized. Cannot send email.');
      return false;
    }

    try {
      // Validate required fields
      if (!options.to) {
        throw new Error('At least one recipient email is required');
      }

      // Prepare recipients
      const toRecipients = Array.isArray(options.to)
        ? options.to.map((email) => ({ address: email }))
        : [{ address: options.to }];

      const ccRecipients = options.cc
        ? Array.isArray(options.cc)
          ? options.cc.map((email) => ({ address: email }))
          : [{ address: options.cc }]
        : [];

      const bccRecipients = options.bcc
        ? Array.isArray(options.bcc)
          ? options.bcc.map((email) => ({ address: email }))
          : [{ address: options.bcc }]
        : [];

      // Use template if provided, otherwise use direct content
      const subject = options.template?.subject || options.subject;
      const htmlContent = options.template?.htmlContent || options.htmlContent;
      const textContent = options.template?.textContent || options.textContent;

      // Prepare email message
      const emailMessage: EmailMessage = {
        senderAddress: this.senderAddress,
        content: {
          subject: subject,
          html: htmlContent || '',
          plainText: textContent || htmlContent || '',
        },
        recipients: {
          to: toRecipients,
          ...(ccRecipients.length > 0 && { cc: ccRecipients }),
          ...(bccRecipients.length > 0 && { bcc: bccRecipients }),
        },
        ...(options.attachments &&
          options.attachments.length > 0 && {
            attachments: options.attachments,
          }),
      };

      // Send email
      const poller = await this.emailClient.beginSend(emailMessage);
      const result = await poller.pollUntilDone();

      this.logger.log(`Email sent successfully via Azure: ${result.id}`);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Handle specific Azure Communication Services errors
      if (error.code === 'DomainNotLinked') {
        this.logger.error(
          'Azure Email Error: Domain not linked. Please verify your domain in Azure Communication Services.',
        );
        this.logger.error('Steps to fix:');
        this.logger.error(
          '1. Go to Azure Portal > Communication Services > Your Resource > Domains',
        );
        this.logger.error('2. Verify your domain or use the default Azure domain');
        this.logger.error('3. Update AZURE_SENDER_EMAIL with a verified domain email');
      } else if (error.code === 'Unauthorized') {
        this.logger.error('Azure Email Error: Invalid connection string or access key');
      } else {
        this.logger.error('Azure Email Error:', error.message || error);
      }
      return false;
    }
  }

  /**
   * Send simple email (main function)
   */
  async azureSendMail(options: {
    email: string;
    subject: string;
    html: string;
    attachments?: Array<{
      name: string;
      contentType: string;
      contentInBase64: string;
    }>;
  }): Promise<boolean> {
    try {
      return await this.sendEmail({
        to: options.email,
        subject: options.subject,
        htmlContent: options.html,
        attachments: options.attachments,
      });
    } catch (error) {
      this.logger.error('Error in azureSendMail:', error);
      return false;
    }
  }

  /**
   * Check if Azure email is configured
   */
  isConfigured(): boolean {
    return this.emailClient !== null;
  }
}

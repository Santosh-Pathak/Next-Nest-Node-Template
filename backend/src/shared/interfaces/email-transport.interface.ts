/**
 * Port for outbound email transports (Strategy + DIP).
 * EmailService tries each transport until one succeeds.
 */
export interface EmailPayload {
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

export interface IEmailTransport {
  readonly name: string;
  isAvailable(): boolean;
  send(payload: EmailPayload): Promise<boolean>;
}

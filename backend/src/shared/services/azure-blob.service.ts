import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { IStorageService, UploadResult } from '@shared/interfaces/storage.interface';

export type { UploadResult };

/**
 * Adapter: Azure Blob Storage implementing IStorageService (DIP).
 */
@Injectable()
export class AzureBlobService implements OnModuleInit, IStorageService {
  private readonly logger = new Logger(AzureBlobService.name);
  private blobServiceClient: BlobServiceClient;
  private accountName: string;
  private containerName: string;

  constructor(private configService: ConfigService) {
    this.initializeBlobService();
  }

  async onModuleInit() {
    await this.initializeContainer();
  }

  private initializeBlobService() {
    this.accountName = this.configService.get<string>('AZURE_STORAGE_ACCOUNT_NAME') || '';
    const accountKey = this.configService.get<string>('AZURE_STORAGE_ACCOUNT_KEY') || '';
    const connectionString = this.configService.get<string>('AZURE_STORAGE_CONNECTION_STRING');
    this.containerName = this.configService.get<string>('AZURE_CONTAINER_NAME') || 'uploads';

    // Create BlobServiceClient
    if (connectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    } else if (this.accountName && accountKey) {
      this.blobServiceClient = new BlobServiceClient(
        `https://${this.accountName}.blob.core.windows.net`,
        new StorageSharedKeyCredential(this.accountName, accountKey),
      );
    } else {
      this.logger.warn('Azure Blob Storage not configured properly');
    }
  }

  private async initializeContainer(): Promise<void> {
    if (!this.blobServiceClient) {
      this.logger.warn('BlobServiceClient not initialized');
      return;
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const containerExists = await containerClient.exists();

      if (!containerExists) {
        await containerClient.create({
          access: 'blob',
        });
      }

      // Ensure container has proper access level
      try {
        await containerClient.setAccessPolicy('blob');
      } catch (error) {
        this.logger.warn('Could not set access policy:', error);
      }
    } catch (error) {
      this.logger.error('Error initializing container:', error);
    }
  }

  /**
   * Generate unique ID for file names
   */
  private generateUniqueId(): string {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const timestamp = Date.now().toString();
    const randomCharsLength = 10;
    const halfLength = Math.floor((randomCharsLength - timestamp.length) / 2);

    const randomChars1 = Array.from(
      { length: halfLength },
      () => characters[Math.floor(Math.random() * characters.length)],
    ).join('');
    const randomChars2 = Array.from(
      { length: randomCharsLength - halfLength - timestamp.length },
      () => characters[Math.floor(Math.random() * characters.length)],
    ).join('');

    return randomChars1 + timestamp + randomChars2;
  }

  /**
   * Upload file buffer to Azure Blob Storage
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimetype: string,
    customContainerName?: string,
  ): Promise<UploadResult> {
    try {
      const fileName = `${this.generateUniqueId()}-${originalName}`;
      const targetContainer = customContainerName || this.containerName;

      const containerClient = this.blobServiceClient.getContainerClient(targetContainer);

      // Ensure container exists
      const containerExists = await containerClient.exists();
      if (!containerExists) {
        this.logger.log(`Creating container: ${targetContainer}`);
        await containerClient.create({ access: 'blob' });
        await containerClient.setAccessPolicy('blob');
      }

      const blobClient = containerClient.getBlockBlobClient(fileName);

      await blobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: mimetype,
        },
      });

      const url = blobClient.url;
      const blobExists = await blobClient.exists();

      this.logger.log(`File uploaded successfully: ${fileName}`);

      return {
        url,
        fileName,
        size: buffer.length,
        mimetype,
        blobExists,
      };
    } catch (error) {
      this.logger.error('Error uploading file to Azure:', error);
      throw error;
    }
  }

  /**
   * Upload buffer with custom filename
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);

      if (!(await containerClient.exists())) {
        await containerClient.create({ access: 'blob' });
      }

      const blobClient = containerClient.getBlockBlobClient(fileName);
      await blobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: contentType },
      });

      return blobClient.url;
    } catch (error) {
      this.logger.error('Error uploading buffer to Azure:', error);
      throw error;
    }
  }

  /**
   * Upload PDF buffer
   */
  async uploadPDF(pdfBuffer: Buffer, baseName: string = 'document'): Promise<UploadResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${baseName}-${timestamp}-${randomSuffix}.pdf`;

    const url = await this.uploadBuffer(pdfBuffer, fileName, 'application/pdf');

    return {
      url,
      fileName,
      size: pdfBuffer.length,
      mimetype: 'application/pdf',
      blobExists: true,
    };
  }

  /**
   * Download blob from Azure
   */
  async downloadBlob(fileName: string): Promise<Buffer> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobClient = containerClient.getBlockBlobClient(fileName);

      const downloadResponse = await blobClient.download();
      const downloadedBuffer = await this.streamToBuffer(downloadResponse.readableStreamBody!);

      return downloadedBuffer;
    } catch (error) {
      this.logger.error('Error downloading from Azure:', error);
      throw error;
    }
  }

  /**
   * Delete blob from Azure
   */
  async deleteBlob(fileName: string): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobClient = containerClient.getBlockBlobClient(fileName);

      await blobClient.delete();
      this.logger.log(`Blob deleted successfully: ${fileName}`);
    } catch (error) {
      this.logger.error('Error deleting from Azure:', error);
      throw error;
    }
  }

  /**
   * List all blobs in container
   */
  async listBlobs(prefix?: string): Promise<string[]> {
    const blobs: string[] = [];
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);

    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      blobs.push(blob.name);
    }

    return blobs;
  }

  /**
   * Check if blob exists
   */
  async blobExists(fileName: string): Promise<boolean> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobClient = containerClient.getBlockBlobClient(fileName);
      return await blobClient.exists();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get blob URL
   */
  getBlobUrl(fileName: string, customContainerName?: string): string {
    const targetContainer = customContainerName || this.containerName;
    return `https://${this.accountName}.blob.core.windows.net/${targetContainer}/${fileName}`;
  }

  /**
   * Helper function to convert stream to buffer
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}

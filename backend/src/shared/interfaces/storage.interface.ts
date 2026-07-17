/**
 * Port for file storage (DIP / ISP).
 * High-level modules depend on this, not Azure/S3 concretes.
 */
export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
  mimetype: string;
  blobExists: boolean;
}

export interface IStorageService {
  uploadFile(
    buffer: Buffer,
    originalName: string,
    mimetype: string,
    containerOrFolder?: string,
  ): Promise<UploadResult>;
}

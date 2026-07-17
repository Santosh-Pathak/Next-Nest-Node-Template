import { Module, Global } from '@nestjs/common';
import { AzureBlobService } from './services/azure-blob.service';
import { DocumentDao } from './services/document-dao.service';
import { STORAGE_SERVICE } from './tokens';

/**
 * Cross-cutting persistence + storage ports only.
 * Email lives in EmailModule; feature modules import what they need.
 */
@Global()
@Module({
  providers: [
    DocumentDao,
    AzureBlobService,
    {
      provide: STORAGE_SERVICE,
      useExisting: AzureBlobService,
    },
  ],
  exports: [DocumentDao, AzureBlobService, STORAGE_SERVICE],
})
export class SharedModule {}

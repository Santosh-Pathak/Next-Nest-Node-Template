import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AzureBlobService } from '@shared/services/azure-blob.service';
import { RequirePermissions } from '@common/decorators/authorization.decorator';
import { Permission } from '@common/enums/permission.enum';

@ApiTags('file')
@Controller('file')
@ApiBearerAuth()
export class FileController {
  constructor(private readonly azureBlobService: AzureBlobService) {}

  @Post('azure-upload')
  @RequirePermissions(Permission.FILE_UPLOAD)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file to Azure Blob Storage' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File uploaded successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'No file uploaded' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('container') container?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.azureBlobService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        container,
      );

      return {
        message: 'File uploaded successfully',
        data: {
          url: result.url,
          fileName: result.fileName,
          size: result.size,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

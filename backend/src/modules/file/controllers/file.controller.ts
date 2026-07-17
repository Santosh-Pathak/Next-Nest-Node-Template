import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequirePermissions } from '@common/decorators/authorization.decorator';
import { Permission } from '@common/enums/permission.enum';
import { STORAGE_SERVICE } from '@shared/tokens';
import { IStorageService } from '@shared/interfaces/storage.interface';

@ApiTags('file')
@Controller('file')
@ApiBearerAuth()
export class FileController {
  constructor(@Inject(STORAGE_SERVICE) private readonly storageService: IStorageService) {}

  @Post('upload')
  @RequirePermissions(Permission.FILE_UPLOAD)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File uploaded successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'No file uploaded' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('container') container?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimePrefixes = ['image/', 'application/pdf', 'text/'];
    const isAllowed = allowedMimePrefixes.some((p) => file.mimetype.startsWith(p));
    if (!isAllowed) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    try {
      const result = await this.storageService.uploadFile(
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

  /** @deprecated Prefer POST /file/upload — kept for backward compatibility */
  @Post('azure-upload')
  @RequirePermissions(Permission.FILE_UPLOAD)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file (legacy azure-upload alias)' })
  async uploadFileLegacy(
    @UploadedFile() file: Express.Multer.File,
    @Body('container') container?: string,
  ) {
    return this.uploadFile(file, container);
  }
}

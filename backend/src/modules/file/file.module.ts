import { Module } from '@nestjs/common';
import { FileController } from './controllers/file.controller';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [FileController],
})
export class FileModule {}

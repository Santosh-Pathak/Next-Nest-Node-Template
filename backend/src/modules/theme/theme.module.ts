import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThemeController } from './controllers/theme.controller';
import { ThemeService } from './services/theme.service';
import { Theme, ThemeSchema } from './schema/theme.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Theme.name, schema: ThemeSchema }])],
  controllers: [ThemeController],
  providers: [ThemeService],
  exports: [ThemeService],
})
export class ThemeModule {}

import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodDtoClass } from './create-zod-dto';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    const metatype = metadata.metatype as ZodDtoClass | undefined;

    if (!metatype || !('schema' in metatype) || !metatype.schema) {
      return value;
    }

    const result = metatype.schema.safeParse(value);

    if (!result.success) {
      const messages = result.error.issues.map((issue) => {
        const path = issue.path.length ? issue.path.join('.') : 'body';
        return `${path}: ${issue.message}`;
      });

      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    }

    return result.data;
  }
}

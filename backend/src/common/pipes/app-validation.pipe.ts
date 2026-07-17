import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { ZodDtoClass } from './create-zod-dto';

/**
 * Hybrid validation (template standard):
 * - Zod DTOs (via createZodDto) → Zod schema
 * - class-validator DTOs → whitelist + transform
 * Prefer Zod for new modules (see Items).
 */
@Injectable()
export class AppValidationPipe implements PipeTransform {
  async transform(value: unknown, metadata: ArgumentMetadata) {
    const { metatype, type } = metadata;

    if (!metatype || !this.shouldValidate(type, metatype)) {
      return value;
    }

    const zodMetatype = metatype as unknown as ZodDtoClass;
    if ('schema' in zodMetatype && zodMetatype.schema) {
      return this.validateZod(value, zodMetatype);
    }

    return this.validateClassValidator(value, metatype);
  }

  private shouldValidate(type: ArgumentMetadata['type'], metatype: Type<unknown>): boolean {
    if (type !== 'body' && type !== 'query' && type !== 'param') {
      return false;
    }
    const primitives = [String, Boolean, Number, Array, Object];
    return !primitives.includes(metatype as never);
  }

  private validateZod(value: unknown, metatype: ZodDtoClass) {
    const result = metatype.schema.safeParse(value);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => {
        const path = issue.path.length ? issue.path.join('.') : 'body';
        return `${path}: ${issue.message}`;
      });
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }
    return result.data;
  }

  private async validateClassValidator(value: unknown, metatype: Type<unknown>) {
    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
    });
    const errors = await validate(object as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: this.flattenErrors(errors),
      });
    }

    return object;
  }

  private flattenErrors(errors: ValidationError[], parent = ''): string[] {
    const messages: string[] = [];
    for (const error of errors) {
      const path = parent ? `${parent}.${error.property}` : error.property;
      if (error.constraints) {
        messages.push(...Object.values(error.constraints).map((m) => `${path}: ${m}`));
      }
      if (error.children?.length) {
        messages.push(...this.flattenErrors(error.children, path));
      }
    }
    return messages;
  }
}

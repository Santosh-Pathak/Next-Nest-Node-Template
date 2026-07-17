import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AppError } from '../errors/app-error';
import { Error as MongooseError } from 'mongoose';

interface ExpressRequest {
  method: string;
  url: string;
}

interface ExpressResponse {
  status: (code: number) => ExpressResponse;
  json: (body: Record<string, unknown>) => void;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ExpressResponse>();
    const request = ctx.getRequest<ExpressRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    if (exception instanceof AppError) {
      status = exception.statusCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const body = exceptionResponse as Record<string, unknown>;

        if (Array.isArray(body.errors)) {
          errors = body.errors as string[];
          message = typeof body.message === 'string' ? body.message : 'Validation failed';
        } else if (Array.isArray(body.message)) {
          errors = body.message as string[];
          message = 'Validation failed';
        } else if (typeof body.message === 'string') {
          message = body.message;
        } else {
          message = exception.message;
        }
      } else {
        message = typeof exceptionResponse === 'string' ? exceptionResponse : exception.message;
      }
    } else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Invalid ${exception.path}: ${exception.value}`;
    } else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      errors = Object.values(exception.errors).map((err) => err.message);
      message = 'Invalid input data';
    } else if ((exception as { code?: number }).code === 11000) {
      status = HttpStatus.BAD_REQUEST;
      const field = Object.keys(
        (exception as { keyPattern?: Record<string, unknown> }).keyPattern || {},
      )[0];
      message = `${field} already exists. Please use another value`;
    } else if ((exception as { name?: string }).name === 'JsonWebTokenError') {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Invalid token. Please log in again';
    } else if ((exception as { name?: string }).name === 'TokenExpiredError') {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Your token has expired. Please log in again';
    }

    const isDevelopment = process.env.NODE_ENV === 'development';

    this.logger.error(
      `${request.method} ${request.url}`,
      isDevelopment && exception instanceof Error ? exception.stack : message,
    );

    const errorResponse: Record<string, unknown> = {
      status: status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'error' : 'fail',
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (errors?.length) {
      errorResponse.errors = errors;
    }

    if (isDevelopment && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}

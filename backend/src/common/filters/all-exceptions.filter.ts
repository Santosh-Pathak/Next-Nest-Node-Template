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

    // Handle custom AppError
    if (exception instanceof AppError) {
      status = exception.statusCode;
      message = exception.message;
    }
    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle validation errors (class-validator)
      if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        const messages = exceptionResponse.message;
        if (Array.isArray(messages)) {
          message = messages.join(', ');
        } else {
          message = messages as string;
        }
      } else {
        message = typeof exceptionResponse === 'string' ? exceptionResponse : exception.message;
      }
    }
    // Handle Mongoose CastError
    else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Invalid ${exception.path}: ${exception.value}`;
    }
    // Handle Mongoose ValidationError
    else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      const errors = Object.values(exception.errors).map((err) => err.message);
      message = `Invalid input data. ${errors.join('. ')}`;
    }
    // Handle MongoDB duplicate key error
    else if ((exception as { code?: number }).code === 11000) {
      status = HttpStatus.BAD_REQUEST;
      const field = Object.keys(
        (exception as { keyPattern?: Record<string, unknown> }).keyPattern || {},
      )[0];
      message = `${field} already exists. Please use another value`;
    }
    // Handle JWT errors
    else if ((exception as { name?: string }).name === 'JsonWebTokenError') {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Invalid token. Please log in again';
    } else if ((exception as { name?: string }).name === 'TokenExpiredError') {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Your token has expired. Please log in again';
    }

    const isDevelopment = process.env.NODE_ENV === 'development';

    // Log error
    this.logger.error(`${request.method} ${request.url}`, isDevelopment ? exception : message);

    // Response format
    const errorResponse: Record<string, unknown> = {
      status: status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'error' : 'fail',
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Add stack trace in development
    if (isDevelopment) {
      errorResponse.error = exception;
      errorResponse.stack = (exception as Error).stack;
    }

    response.status(status).json(errorResponse);
  }
}

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  status: string;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has the response format, return as is
        if (data && typeof data === 'object' && 'status' in data && 'message' in data) {
          return data;
        }

        // Otherwise, wrap the data in the standard format
        return {
          status: 'success',
          message: data?.message || 'Request processed successfully',
          data: data?.data !== undefined ? data.data : data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

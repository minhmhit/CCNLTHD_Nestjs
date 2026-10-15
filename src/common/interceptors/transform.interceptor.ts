import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseSuccessFormat<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<
  T,
> implements NestInterceptor<T, ResponseSuccessFormat<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseSuccessFormat<T>> {
    const response = context
      .switchToHttp()
      .getResponse<Response>();

    return next.handle().pipe(
      map((data: T) => {
        if (
          data &&
          typeof data === 'object' &&
          'status' in data &&
          'info' in data
        ) {
          const healthData = data as Record<
            string,
            unknown
          >;
          return {
            status: healthData.status,
            info: healthData.info,
            details: healthData.details,
            success: true,
            statusCode: response.statusCode || 200,
            data,
            timestamp: new Date().toISOString(),
          } as unknown as ResponseSuccessFormat<T>;
        }

        return {
          success: true,
          statusCode: response.statusCode || 200,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

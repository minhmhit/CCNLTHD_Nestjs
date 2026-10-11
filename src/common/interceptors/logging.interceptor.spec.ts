import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log success request with duration and status code', (done) => {
    const mockRequest = {
      requestId: 'test-uuid-1234',
      method: 'GET',
      originalUrl: '/api/test',
    };
    const mockResponse = {
      statusCode: 200,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = {
      handle: () => of('result_data'),
    };

    interceptor.intercept(context, next).subscribe({
      next: (val) => {
        expect(val).toBe('result_data');
      },
      complete: () => {
        done();
      },
    });
  });

  it('should log error when request fails with HttpException', (done) => {
    const mockRequest = {
      requestId: 'test-uuid-5678',
      method: 'POST',
      originalUrl: '/api/fail',
    };
    const mockResponse = {
      statusCode: 400,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const error = new HttpException(
      'Bad request error',
      HttpStatus.BAD_REQUEST,
    );
    const next: CallHandler = {
      handle: () => throwError(() => error),
    };

    interceptor.intercept(context, next).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });
});

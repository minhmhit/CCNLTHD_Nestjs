import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

interface ErrorResponsePayload {
  success: boolean;
  statusCode: number;
  errorCode: string;
  message: string;
  requestId: string;
  path: string;
  timestamp: string;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should format HttpException properly with requestId, errorCode, and timestamp', () => {
    let capturedPayload: ErrorResponsePayload | undefined;
    const jsonMock = jest.fn(
      (payload: ErrorResponsePayload) => {
        capturedPayload = payload;
      },
    );
    const statusMock = jest.fn().mockReturnValue({
      json: jsonMock,
    });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: statusMock,
        }),
        getRequest: () => ({
          requestId: 'test-req-id-123',
          originalUrl: '/test-url',
        }),
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException(
      'Không tìm thấy dữ liệu',
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(capturedPayload).toBeDefined();
    expect(capturedPayload?.success).toBe(false);
    expect(capturedPayload?.statusCode).toBe(404);
    expect(capturedPayload?.errorCode).toBe('NOT_FOUND');
    expect(capturedPayload?.message).toBe(
      'Không tìm thấy dữ liệu',
    );
    expect(capturedPayload?.requestId).toBe(
      'test-req-id-123',
    );
    expect(capturedPayload?.path).toBe('/test-url');
    expect(typeof capturedPayload?.timestamp).toBe(
      'string',
    );
  });

  it('should format unhandled Error with 500 status and INTERNAL_SERVER_ERROR', () => {
    let capturedPayload: ErrorResponsePayload | undefined;
    const jsonMock = jest.fn(
      (payload: ErrorResponsePayload) => {
        capturedPayload = payload;
      },
    );
    const statusMock = jest.fn().mockReturnValue({
      json: jsonMock,
    });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: statusMock,
        }),
        getRequest: () => ({
          requestId: 'test-req-id-999',
          originalUrl: '/server-error',
        }),
      }),
    } as unknown as ArgumentsHost;

    const exception = new Error(
      'Database connection crashed',
    );

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(capturedPayload).toBeDefined();
    expect(capturedPayload?.success).toBe(false);
    expect(capturedPayload?.statusCode).toBe(500);
    expect(capturedPayload?.errorCode).toBe(
      'INTERNAL_SERVER_ERROR',
    );
    expect(capturedPayload?.message).toBe(
      'Database connection crashed',
    );
    expect(capturedPayload?.requestId).toBe(
      'test-req-id-999',
    );
    expect(capturedPayload?.path).toBe('/server-error');
    expect(typeof capturedPayload?.timestamp).toBe(
      'string',
    );
  });
});

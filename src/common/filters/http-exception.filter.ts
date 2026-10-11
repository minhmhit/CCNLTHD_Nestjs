import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

function resolveErrorCode(
  status: number,
  errorBody?: Record<string, unknown>,
): string {
  if (typeof errorBody?.errorCode === 'string') {
    return errorBody.errorCode;
  }
  if (
    typeof errorBody?.error === 'string' &&
    errorBody.error.length > 0
  ) {
    return errorBody.error
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    case 500:
      return 'INTERNAL_SERVER_ERROR';
    default:
      return 'ERROR';
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(
    HttpExceptionFilter.name,
  );

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId = (req['requestId'] as string) || '';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const errorBody: Record<string, unknown> =
        typeof exceptionResponse === 'string'
          ? { message: exceptionResponse }
          : (exceptionResponse as Record<string, unknown>);

      const message =
        errorBody.message || 'Đã có lỗi xảy ra';

      res.status(status).json({
        success: false,
        statusCode: status,
        errorCode: resolveErrorCode(status, errorBody),
        message,
        requestId,
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.url,
      });

      return;
    }

    this.logger.error('Unhandled exception:', exception);
    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    res.status(status).json({
      success: false,
      statusCode: status,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message:
        exception instanceof Error
          ? exception.message
          : 'Đã có lỗi xảy ra, vui lòng thử lại sau',
      requestId,
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.url,
    });
  }
}
